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

  // Build best score per player per levelId
  const bestPerLevel = new Map<string, Map<number, number>>();
  for (const log of logs) {
    try {
      const topic1 = log.topics[1];
      const topic2 = log.topics[2];
      if (!topic1 || topic1.length < 42) continue;
      if (!topic2) continue;
      if (!log.data || log.data.length < 66) continue;

      const player = ethers.getAddress("0x" + topic1.slice(26));
      const levelId = Number(ethers.toBigInt(topic2));
      const scoreBig = ethers.toBigInt(log.data.slice(0, 66));
      const score = Number(scoreBig);
      if (!Number.isSafeInteger(score) || score < 0) continue;

      let levels = bestPerLevel.get(player);
      if (!levels) {
        levels = new Map<number, number>();
        bestPerLevel.set(player, levels);
      }
      const prev = levels.get(levelId) ?? 0;
      if (score > prev) levels.set(levelId, score);
    } catch {
      continue;
    }
  }

  // Sum best-per-piece into global total
  const totals: [string, number][] = [];
  for (const [player, levels] of bestPerLevel) {
    let total = 0;
    for (const score of levels.values()) total += score;
    if (total > 0) totals.push([player, total]);
  }

  // Sort by total descending, then by address for deterministic tie order
  totals.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = totals.slice(0, 10);

  const fullAddresses = top.map(([addr]) => addr);
  const verifiedMap = await checkPassportScores(fullAddresses);

  // Assign ranks with ties (same score = same rank, skip next)
  const rows: LeaderboardRow[] = [];
  let currentRank = 1;
  for (let i = 0; i < top.length; i++) {
    const [addr, score] = top[i];
    if (i > 0 && score < top[i - 1][1]) {
      currentRank = i + 1;
    }
    rows.push({
      rank: currentRank,
      player: addr.slice(0, 6) + "..." + addr.slice(-4),
      score,
      isVerified: verifiedMap.get(addr) ?? false,
    });
  }

  return rows;
}
