import { ImageResponse } from "next/og";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import { victoryAbi } from "@/lib/contracts/victory";

export const runtime = "edge";

const W = 1200;
const H = 630;

const DIFFICULTY_LABEL: Record<number, string> = { 1: "EASY", 2: "MEDIUM", 3: "HARD" };

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `0:${String(sec).padStart(2, "0")}`;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const tokenId = BigInt(params.id);
  const contractAddress = process.env.NEXT_PUBLIC_VICTORY_NFT_ADDRESS as `0x${string}` | undefined;

  let moves = "7";
  let time = "0:16";
  let difficulty = "EASY";
  let player = "0x...";

  if (contractAddress) {
    try {
      const client = createPublicClient({ chain: celo, transport: http() });

      const [victoryData, owner] = await Promise.all([
        client.readContract({
          address: contractAddress,
          abi: victoryAbi,
          functionName: "victories",
          args: [tokenId],
        }),
        client.readContract({
          address: contractAddress,
          abi: victoryAbi,
          functionName: "ownerOf",
          args: [tokenId],
        }),
      ]);

      const [diff, totalMoves, timeMs] = victoryData as [number, number, number];
      moves = String(totalMoves);
      time = formatTime(timeMs);
      difficulty = DIFFICULTY_LABEL[diff] ?? "EASY";
      const ownerAddr = owner as string;
      player = `${ownerAddr.slice(0, 6)}...${ownerAddr.slice(-4)}`;
    } catch {
      // Token may not exist yet — use defaults
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#e4f6fb",
          background: "linear-gradient(160deg, #0a1424 0%, #0b1628 40%, #0f1d35 70%, #0a1424 100%)",
          position: "relative",
        }}
      >
        {/* Headline */}
        <div style={{ display: "flex", fontSize: 72, fontWeight: 900, letterSpacing: "0.06em", color: "#5eead4", lineHeight: 1, marginBottom: 20 }}>
          CHECKMATE
        </div>

        {/* Performance */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700, color: "#f5f5f5", letterSpacing: "0.04em", marginBottom: 20 }}>
          {`${moves} MOVES \u2022 ${time}`}
        </div>

        {/* Difficulty pill */}
        <div style={{ display: "flex", padding: "6px 24px", borderRadius: 20, border: "1px solid rgba(160,205,225,0.15)", background: "rgba(255,255,255,0.04)", fontSize: 14, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(160,205,225,0.5)", marginBottom: 32 }}>
          {difficulty}
        </div>

        {/* Challenge line */}
        <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#fbbf24", letterSpacing: "0.02em", marginBottom: 28 }}>
          Can you beat this?
        </div>

        {/* Player + Victory ID */}
        <div style={{ display: "flex", fontSize: 16, fontWeight: 400, color: "rgba(160,205,225,0.4)", marginBottom: 8 }}>
          {`Victory #${params.id} \u2022 ${player}`}
        </div>

        {/* Brand */}
        <div style={{ display: "flex", fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(20,184,166,0.35)" }}>
          CHESSCITO
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
