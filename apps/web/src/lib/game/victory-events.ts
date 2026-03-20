import type { PublicClient } from "viem";
import { parseAbiItem } from "viem";
import { getVictoryNFTAddress, getConfiguredChainId } from "@/lib/contracts/chains";

export type VictoryEntry = {
  tokenId: bigint;
  player: string;
  difficulty: number;
  totalMoves: number;
  timeMs: number;
  blockNumber: bigint;
  logIndex: number;
  timestamp: number; // unix seconds, resolved from block
};

/** Known safe start block — VictoryNFT deployed 2026-03-17, no events before this. */
export const EVENT_SCAN_START = 61_250_000n;

const CHUNK_SIZE = 50_000n;

const VictoryMintedEvent = parseAbiItem(
  "event VictoryMinted(address indexed player, uint256 indexed tokenId, uint8 difficulty, uint16 totalMoves, uint32 timeMs, address indexed token, uint256 totalAmount)"
);

/** Returns the VictoryNFT address if configured, or null. Used by page to detect config errors. */
export function getVictoryAddress(): `0x${string}` | null {
  const chainId = getConfiguredChainId();
  return chainId ? getVictoryNFTAddress(chainId) : null;
}

async function getLogsPaginated(
  client: PublicClient,
  args: {
    address: `0x${string}`;
    event: typeof VictoryMintedEvent;
    args?: { player?: `0x${string}` };
  },
  fromBlock: bigint,
  toBlock: bigint
) {
  const logs = [];
  for (let from = fromBlock; from <= toBlock; from += CHUNK_SIZE) {
    const to = from + CHUNK_SIZE - 1n > toBlock ? toBlock : from + CHUNK_SIZE - 1n;
    const chunk = await client.getLogs({
      address: args.address,
      event: args.event,
      args: args.args,
      fromBlock: from,
      toBlock: to,
    });
    logs.push(...chunk);
  }
  return logs;
}

async function resolveTimestamps(
  client: PublicClient,
  blockNumbers: bigint[]
): Promise<Map<bigint, number>> {
  const unique = [...new Set(blockNumbers.map(String))].map(BigInt);
  const blocks = await Promise.all(
    unique.map((n) => client.getBlock({ blockNumber: n }))
  );
  const map = new Map<bigint, number>();
  for (const block of blocks) {
    map.set(block.number, Number(block.timestamp));
  }
  return map;
}

function logsToEntries(
  logs: Awaited<ReturnType<typeof getLogsPaginated>>,
  timestamps: Map<bigint, number>
): VictoryEntry[] {
  return logs.map((log) => ({
    tokenId: log.args.tokenId!,
    player: log.args.player!,
    difficulty: Number(log.args.difficulty!),
    totalMoves: Number(log.args.totalMoves!),
    timeMs: Number(log.args.timeMs!),
    blockNumber: log.blockNumber,
    logIndex: log.logIndex,
    timestamp: timestamps.get(log.blockNumber) ?? 0,
  }));
}

/** Sort by blockNumber desc, logIndex desc (newest first, deterministic). */
function sortNewestFirst(entries: VictoryEntry[]): VictoryEntry[] {
  return entries.sort((a, b) => {
    const blockDiff = Number(b.blockNumber - a.blockNumber);
    return blockDiff !== 0 ? blockDiff : b.logIndex - a.logIndex;
  });
}

export async function fetchMyVictories(
  client: PublicClient,
  player: `0x${string}`
): Promise<VictoryEntry[]> {
  const address = getVictoryAddress();
  if (!address) return [];

  const latest = await client.getBlockNumber();
  const logs = await getLogsPaginated(
    client,
    { address, event: VictoryMintedEvent, args: { player } },
    EVENT_SCAN_START,
    latest
  );

  const timestamps = await resolveTimestamps(
    client,
    logs.map((l) => l.blockNumber)
  );

  return sortNewestFirst(logsToEntries(logs, timestamps));
}

export async function fetchHallOfFame(
  client: PublicClient
): Promise<VictoryEntry[]> {
  const address = getVictoryAddress();
  if (!address) return [];

  const latest = await client.getBlockNumber();
  const logs = await getLogsPaginated(
    client,
    { address, event: VictoryMintedEvent },
    EVENT_SCAN_START,
    latest
  );

  const timestamps = await resolveTimestamps(
    client,
    logs.map((l) => l.blockNumber)
  );

  return sortNewestFirst(logsToEntries(logs, timestamps)).slice(0, 10);
}
