import { Redis } from "@upstash/redis";
import { createPublicClient, http, parseAbiItem } from "viem";
import { celo } from "viem/chains";

import { HOF_KEYS } from "@/lib/coach/redis-keys";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RPC_URL = process.env.CELO_RPC_URL ?? "https://forno.celo.org";
const VICTORY_NFT = process.env.NEXT_PUBLIC_VICTORY_NFT_ADDRESS as
  | `0x${string}`
  | undefined;

const EVENT_SCAN_START = 61_250_000n;
const CHUNK_SIZE = 50_000n;
const REORG_BUFFER = 10n;
const REFRESH_LOCK_TTL = 30; // seconds
const REFRESH_TIMEOUT_MS = 8_000; // max time API route waits for refresh
const SCORE_MULTIPLIER = 100_000n;

const VictoryMintedEvent = parseAbiItem(
  "event VictoryMinted(address indexed player, uint256 indexed tokenId, uint8 difficulty, uint16 totalMoves, uint32 timeMs, address indexed token, uint256 totalAmount)"
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IndexedVictoryRow = {
  id: string; // txHash:logIndex — stable identity for dedup
  tokenId: string;
  player: string;
  difficulty: number;
  totalMoves: number;
  timeMs: number;
  timestamp: number;
};

export type RefreshMetrics = {
  event: "hof:refresh";
  blocksScanned: number;
  newEventsFound: number;
  redisWriteCount: number;
  indexedThroughBlock: number;
  scanDurationMs: number;
  staleServed: boolean;
  refreshFailed: boolean;
  lockAcquired: boolean;
  error?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic JSON for sorted set member dedup. */
export function canonicalJSON(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function computeScore(blockNumber: bigint, logIndex: number): number {
  return Number(blockNumber * SCORE_MULTIPLIER + BigInt(logIndex));
}

function parseRow(member: string): IndexedVictoryRow {
  return JSON.parse(member) as IndexedVictoryRow;
}

function makeClient() {
  return createPublicClient({ chain: celo, transport: http(RPC_URL) });
}

function makeRedis() {
  return Redis.fromEnv();
}

// ---------------------------------------------------------------------------
// Read path — always fast, pure Redis reads
// ---------------------------------------------------------------------------

export async function readHofEntries(
  redis?: Redis
): Promise<{ rows: IndexedVictoryRow[]; lastBlock: number }> {
  const r = redis ?? makeRedis();
  try {
    const [members, lb] = await Promise.all([
      r.zrange(HOF_KEYS.entries, 0, 9, { rev: true }) as Promise<string[]>,
      r.get<string>(HOF_KEYS.lastBlock),
    ]);
    return {
      rows: members.map(parseRow),
      lastBlock: lb ? Number(lb) : 0,
    };
  } catch {
    return { rows: [], lastBlock: 0 };
  }
}

export async function readPlayerVictories(
  player: string,
  redis?: Redis
): Promise<{ rows: IndexedVictoryRow[]; lastBlock: number }> {
  const r = redis ?? makeRedis();
  try {
    const [members, lb] = await Promise.all([
      r.zrange(HOF_KEYS.player(player), 0, -1, { rev: true }) as Promise<string[]>,
      r.get<string>(HOF_KEYS.lastBlock),
    ]);
    return {
      rows: members.map(parseRow),
      lastBlock: lb ? Number(lb) : 0,
    };
  } catch {
    return { rows: [], lastBlock: 0 };
  }
}

// ---------------------------------------------------------------------------
// Refresh path — incremental scan, best-effort
// ---------------------------------------------------------------------------

export async function refreshHofIndex(redis?: Redis): Promise<RefreshMetrics> {
  const start = Date.now();
  const metrics: RefreshMetrics = {
    event: "hof:refresh",
    blocksScanned: 0,
    newEventsFound: 0,
    redisWriteCount: 0,
    indexedThroughBlock: 0,
    scanDurationMs: 0,
    staleServed: false,
    refreshFailed: false,
    lockAcquired: false,
  };

  if (!VICTORY_NFT) {
    metrics.scanDurationMs = Date.now() - start;
    return metrics;
  }

  const r = redis ?? makeRedis();

  // 1. Try to acquire lock
  const locked = await r.set(HOF_KEYS.refreshLock, Date.now().toString(), {
    nx: true,
    ex: REFRESH_LOCK_TTL,
  });
  if (!locked) {
    metrics.staleServed = true;
    metrics.scanDurationMs = Date.now() - start;
    return metrics;
  }
  metrics.lockAcquired = true;

  try {
    // 2. Read lastBlock
    const storedBlock = await r.get<string>(HOF_KEYS.lastBlock);
    const lastBlock = storedBlock ? BigInt(storedBlock) : EVENT_SCAN_START;

    // 3. Compute scan range with reorg buffer
    const scanFrom =
      lastBlock > EVENT_SCAN_START + REORG_BUFFER
        ? lastBlock - REORG_BUFFER
        : EVENT_SCAN_START;

    // 4. Get latest block
    const client = makeClient();
    const latestBlock = await client.getBlockNumber();

    if (latestBlock <= scanFrom) {
      metrics.indexedThroughBlock = Number(lastBlock);
      metrics.scanDurationMs = Date.now() - start;
      await r.del(HOF_KEYS.refreshLock);
      return metrics;
    }

    // 5. Scan logs in chunks
    const allLogs = [];
    for (let from = scanFrom; from <= latestBlock; from += CHUNK_SIZE) {
      const to =
        from + CHUNK_SIZE - 1n > latestBlock
          ? latestBlock
          : from + CHUNK_SIZE - 1n;
      const chunk = await client.getLogs({
        address: VICTORY_NFT,
        event: VictoryMintedEvent,
        fromBlock: from,
        toBlock: to,
      });
      allLogs.push(...chunk);
    }

    metrics.blocksScanned = Number(latestBlock - scanFrom);
    metrics.newEventsFound = allLogs.length;

    // 6. Index events into Redis
    if (allLogs.length > 0) {
      // Resolve timestamps
      const uniqueBlockNums = [
        ...new Set(allLogs.map((l) => l.blockNumber.toString())),
      ].map(BigInt);
      const blocks = await Promise.all(
        uniqueBlockNums.map((n) => client.getBlock({ blockNumber: n }))
      );
      const tsMap = new Map<bigint, number>();
      for (const block of blocks) {
        tsMap.set(block.number, Number(block.timestamp));
      }

      const pipeline = r.pipeline();
      for (const log of allLogs) {
        const row: IndexedVictoryRow = {
          id: `${log.transactionHash}:${log.logIndex}`,
          tokenId: log.args.tokenId!.toString(),
          player: log.args.player!,
          difficulty: Number(log.args.difficulty!),
          totalMoves: Number(log.args.totalMoves!),
          timeMs: Number(log.args.timeMs!),
          timestamp: tsMap.get(log.blockNumber) ?? 0,
        };
        const score = computeScore(log.blockNumber, log.logIndex);
        const member = canonicalJSON(row as unknown as Record<string, unknown>);

        pipeline.zadd(HOF_KEYS.entries, { score, member });
        pipeline.zadd(HOF_KEYS.player(log.args.player!), { score, member });
        metrics.redisWriteCount += 2;
      }
      await pipeline.exec();
    }

    // 7. Advance checkpoint only after successful writes
    await r.set(HOF_KEYS.lastBlock, latestBlock.toString());
    metrics.indexedThroughBlock = Number(latestBlock);
  } catch (err) {
    metrics.refreshFailed = true;
    metrics.staleServed = true;
    metrics.error = err instanceof Error ? err.message : "Unknown refresh error";
  } finally {
    // 8. Release lock
    try {
      await r.del(HOF_KEYS.refreshLock);
    } catch {
      // Lock will auto-expire via TTL
    }
    metrics.scanDurationMs = Date.now() - start;
  }

  return metrics;
}

// ---------------------------------------------------------------------------
// Timeout-guarded refresh for API routes
// ---------------------------------------------------------------------------

const STALE_METRICS: RefreshMetrics = {
  event: "hof:refresh",
  blocksScanned: 0,
  newEventsFound: 0,
  redisWriteCount: 0,
  indexedThroughBlock: 0,
  scanDurationMs: 0,
  staleServed: true,
  refreshFailed: false,
  lockAcquired: false,
};

/**
 * Best-effort refresh with timeout. If the scan exceeds REFRESH_TIMEOUT_MS
 * (e.g., first run before backfill), the API route still responds quickly
 * with whatever Redis already has. The scan continues in the background.
 */
export async function tryRefresh(redis?: Redis): Promise<RefreshMetrics> {
  const timeout = new Promise<RefreshMetrics>((resolve) =>
    setTimeout(() => resolve({ ...STALE_METRICS, error: "refresh timeout" }), REFRESH_TIMEOUT_MS)
  );
  return Promise.race([refreshHofIndex(redis), timeout]);
}
