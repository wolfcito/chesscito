/**
 * Backfill Hall of Fame index in Redis.
 *
 * Reads VictoryMinted events from chain and indexes them into Upstash Redis
 * sorted sets. Resumable — reads hof:lastBlock to determine start.
 *
 * Usage:
 *   cd apps/web && npx tsx scripts/backfill-hof.ts
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *   NEXT_PUBLIC_VICTORY_NFT_ADDRESS
 *   CELO_RPC_URL (optional, defaults to forno.celo.org)
 */

import { Redis } from "@upstash/redis";
import { createPublicClient, http, parseAbiItem } from "viem";
import { celo } from "viem/chains";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RPC_URL = process.env.CELO_RPC_URL ?? "https://forno.celo.org";
const VICTORY_NFT = process.env.NEXT_PUBLIC_VICTORY_NFT_ADDRESS as
  | `0x${string}`
  | undefined;

const EVENT_SCAN_START = 61_250_000n;
const CHUNK_SIZE = 50_000n;
const SCORE_MULTIPLIER = 100_000n;

const HOF_KEYS = {
  lastBlock: "hof:lastBlock",
  entries: "hof:entries",
  player: (address: string) => `hof:player:${address.toLowerCase()}`,
} as const;

const VictoryMintedEvent = parseAbiItem(
  "event VictoryMinted(address indexed player, uint256 indexed tokenId, uint8 difficulty, uint16 totalMoves, uint32 timeMs, address indexed token, uint256 totalAmount)"
);

// ---------------------------------------------------------------------------
// Helpers (self-contained — no @/ imports for standalone execution)
// ---------------------------------------------------------------------------

type IndexedRow = {
  id: string;
  tokenId: string;
  player: string;
  difficulty: number;
  totalMoves: number;
  timeMs: number;
  timestamp: number;
};

function canonicalJSON(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!VICTORY_NFT) {
    console.error("NEXT_PUBLIC_VICTORY_NFT_ADDRESS is not set. Aborting.");
    process.exit(1);
  }

  const redis = Redis.fromEnv();
  const client = createPublicClient({ chain: celo, transport: http(RPC_URL) });

  const storedBlock = await redis.get<string>(HOF_KEYS.lastBlock);
  const startBlock = storedBlock ? BigInt(storedBlock) : EVENT_SCAN_START;
  const latestBlock = await client.getBlockNumber();

  const totalBlocks = latestBlock - startBlock;
  const totalChunks = Number(totalBlocks / CHUNK_SIZE) + 1;

  console.log(`Backfill: ${startBlock} -> ${latestBlock} (${totalBlocks} blocks, ~${totalChunks} chunks)`);
  console.log(`Contract: ${VICTORY_NFT}`);
  console.log(`RPC: ${RPC_URL}\n`);

  if (latestBlock <= startBlock) {
    console.log("Already up to date. Nothing to backfill.");
    return;
  }

  let totalEvents = 0;
  let chunkIndex = 0;

  for (let from = startBlock; from <= latestBlock; from += CHUNK_SIZE) {
    chunkIndex++;
    const to =
      from + CHUNK_SIZE - 1n > latestBlock
        ? latestBlock
        : from + CHUNK_SIZE - 1n;

    const chunkStart = Date.now();
    const logs = await client.getLogs({
      address: VICTORY_NFT,
      event: VictoryMintedEvent,
      fromBlock: from,
      toBlock: to,
    });

    if (logs.length > 0) {
      // Resolve timestamps
      const uniqueBlockNums = [
        ...new Set(logs.map((l) => l.blockNumber.toString())),
      ].map(BigInt);
      const blocks = await Promise.all(
        uniqueBlockNums.map((n) => client.getBlock({ blockNumber: n }))
      );
      const tsMap = new Map<bigint, number>();
      for (const block of blocks) {
        tsMap.set(block.number, Number(block.timestamp));
      }

      const pipeline = redis.pipeline();
      for (const log of logs) {
        const row: IndexedRow = {
          id: `${log.transactionHash}:${log.logIndex}`,
          tokenId: log.args.tokenId!.toString(),
          player: log.args.player!,
          difficulty: Number(log.args.difficulty!),
          totalMoves: Number(log.args.totalMoves!),
          timeMs: Number(log.args.timeMs!),
          timestamp: tsMap.get(log.blockNumber) ?? 0,
        };
        const score = Number(log.blockNumber * SCORE_MULTIPLIER + BigInt(log.logIndex));
        const member = canonicalJSON(row as unknown as Record<string, unknown>);
        pipeline.zadd(HOF_KEYS.entries, { score, member });
        pipeline.zadd(HOF_KEYS.player(log.args.player!), { score, member });
      }
      await pipeline.exec();
      totalEvents += logs.length;
    }

    // Advance checkpoint after each successful chunk
    await redis.set(HOF_KEYS.lastBlock, to.toString());

    const elapsed = Date.now() - chunkStart;
    console.log(
      `  Chunk ${chunkIndex}/${totalChunks}: ${from}→${to} | ${logs.length} events | ${elapsed}ms`
    );
  }

  console.log(`\nBackfill complete. Total events indexed: ${totalEvents}`);
  console.log(`Indexed through block: ${latestBlock}`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
