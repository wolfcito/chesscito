import { ethers } from "ethers";
import { checkPassportScores } from "./passport";

export type LeaderboardRow = {
  rank: number;
  player: string;
  score: number;
  isVerified?: boolean;
};

const RPC_URL = process.env.CELO_RPC_URL ?? "https://forno.celo.org";
const DEPLOY_BLOCK = 61_113_664;

const SCORE_SUBMITTED_TOPIC = ethers.id(
  "ScoreSubmitted(address,uint256,uint256,uint256,uint256,uint256)"
);

const CHUNK_SIZE = 50_000;

async function getLogsPaginated(
  provider: ethers.JsonRpcProvider,
  filter: { address: string; topics: string[]; fromBlock: number; toBlock: number }
): Promise<ethers.Log[]> {
  const allLogs: ethers.Log[] = [];
  let from = filter.fromBlock;

  while (from <= filter.toBlock) {
    const to = Math.min(from + CHUNK_SIZE - 1, filter.toBlock);
    const chunk = await provider.getLogs({ ...filter, fromBlock: from, toBlock: to });
    allLogs.push(...chunk);
    from = to + 1;
  }

  return allLogs;
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const address = process.env.NEXT_PUBLIC_SCOREBOARD_ADDRESS ?? "";
  if (!address) return [];

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const currentBlock = await provider.getBlockNumber();

  const logs = await getLogsPaginated(provider, {
    address,
    topics: [SCORE_SUBMITTED_TOPIC],
    fromBlock: DEPLOY_BLOCK,
    toBlock: currentBlock,
  });

  const best = new Map<string, number>();
  for (const log of logs) {
    try {
      // Validate topic[1] exists and has expected length (66 hex chars = "0x" + 64)
      const topic1 = log.topics[1];
      if (!topic1 || topic1.length < 42) continue;

      // Validate data has at least 66 chars for first uint256 (score)
      if (!log.data || log.data.length < 66) continue;

      const player = ethers.getAddress("0x" + topic1.slice(26));
      // data: score (32 bytes) | timeMs | nonce | deadline
      const scoreBig = ethers.toBigInt(log.data.slice(0, 66));
      // Guard against Number overflow (scores should never exceed safe integer)
      const score = Number(scoreBig);
      if (!Number.isFinite(score) || score < 0) continue;

      const prev = best.get(player) ?? 0;
      if (score > prev) best.set(player, score);
    } catch {
      // Skip malformed event, continue processing remaining logs
      continue;
    }
  }

  const sorted = Array.from(best.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const fullAddresses = sorted.map(([addr]) => addr);
  const verifiedMap = await checkPassportScores(fullAddresses);

  return sorted.map(([addr, score], i) => ({
    rank: i + 1,
    player: addr.slice(0, 6) + "..." + addr.slice(-4),
    score,
    isVerified: verifiedMap.get(addr) ?? false,
  }));
}
