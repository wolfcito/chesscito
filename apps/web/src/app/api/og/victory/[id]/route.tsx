import { ImageResponse } from "next/og";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import { victoryAbi } from "@/lib/contracts/victory";
import { clampMoves, clampTime, formatPlayer, truncateId } from "@/lib/og/og-utils";
import { KING_DATA_URI } from "@/lib/og/king-svg";

export const runtime = "edge";

const W = 1200;
const H = 630;
const PAD = 80;

const DIFFICULTY_LABEL: Record<number, string> = { 1: "EASY", 2: "MEDIUM", 3: "HARD" };

// R2: cache headers
const SUCCESS_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  "CDN-Cache-Control": "public, s-maxage=86400",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

// R5: module-scope client reuse
const contractAddress = process.env.NEXT_PUBLIC_VICTORY_NFT_ADDRESS as `0x${string}` | undefined;
const client = contractAddress
  ? createPublicClient({ chain: celo, transport: http() })
  : null;

const FONT_PATH = "/fonts/Cinzel-Bold.ttf";

// R3: error card — "Victory not found" with 404 + no-store
function errorCard() {
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
          background: "radial-gradient(ellipse at 65% 50%, #0b1628 0%, #0a1424 70%)",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "rgba(94,234,212,0.5)", letterSpacing: "0.04em", marginBottom: 16 }}>
          Victory not found
        </div>
        <div style={{ display: "flex", fontSize: 16, fontWeight: 400, color: "rgba(160,205,225,0.4)", marginBottom: 32 }}>
          This victory may not exist yet
        </div>
        <div style={{ display: "flex", fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(20,184,166,0.35)" }}>
          CHESSCITO
        </div>
      </div>
    ),
    { width: W, height: H, status: 404, headers: ERROR_HEADERS },
  );
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // R1: input validation
  const raw = params.id;
  if (!raw || !/^\d{1,78}$/.test(raw)) {
    return new Response("Invalid token ID", { status: 400 });
  }
  const tokenId = BigInt(raw);

  if (!client || !contractAddress) {
    return errorCard();
  }

  // Font loading — fetch from public/ via HTTP (file:// not supported in edge runtime)
  let cinzelData: ArrayBuffer | null = null;
  try {
    const fontUrl = new URL(FONT_PATH, req.url);
    const res = await fetch(fontUrl);
    if (!res.ok) throw new Error(`Font fetch ${res.status}`);
    cinzelData = await res.arrayBuffer();
  } catch {
    /* system serif fallback — card still renders */
  }

  let moves: string;
  let time: string;
  let difficulty: string;
  let player: string;

  try {
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
    moves = clampMoves(totalMoves);        // R8: value clamping
    time = clampTime(timeMs);              // R8: value clamping
    difficulty = DIFFICULTY_LABEL[diff] ?? "EASY";
    player = formatPlayer(owner as string); // R11: player formatting
  } catch {
    return errorCard(); // R3: no fake stats
  }

  const displayId = truncateId(raw); // R11: ID truncation

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
          background: "radial-gradient(ellipse at 65% 50%, #0b1628 0%, #0a1424 70%)",
          position: "relative",
          padding: PAD,
        }}
      >
        {/* Teal atmosphere glow — decorative */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "30%",
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(94,234,212,0.03) 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* King watermark — decorative */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={KING_DATA_URI}
          alt=""
          width={280}
          height={336}
          style={{
            position: "absolute",
            right: 100,
            top: 147,
            opacity: 0.045,
          }}
        />

        {/* Headline */}
        <div style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          fontFamily: cinzelData ? "Cinzel" : "serif",
          letterSpacing: "0.08em",
          color: "#5eead4",
          textShadow: "0 0 30px rgba(94,234,212,0.20)",
          lineHeight: 1,
          marginBottom: 20,
        }}>
          CHECKMATE
        </div>

        {/* Separator */}
        <div style={{
          display: "flex",
          width: 200,
          height: 1,
          background: "rgba(94,234,212,0.15)",
          marginBottom: 20,
        }} />

        {/* Performance */}
        <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "#f5f5f5", letterSpacing: "0.04em", marginBottom: 20 }}>
          {`${moves} MOVES \u2022 ${time}`}
        </div>

        {/* Difficulty pill */}
        <div style={{ display: "flex", padding: "6px 24px", borderRadius: 20, border: "1px solid rgba(160,205,225,0.12)", background: "rgba(255,255,255,0.03)", fontSize: 14, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(160,205,225,0.45)", marginBottom: 28 }}>
          {difficulty}
        </div>

        {/* Challenge line */}
        <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#fbbf24", letterSpacing: "0.02em", marginBottom: 28 }}>
          Can you beat this?
        </div>

        {/* Player + Victory ID */}
        <div style={{ display: "flex", fontSize: 16, fontWeight: 400, color: "rgba(160,205,225,0.4)", marginBottom: 8 }}>
          {`Victory #${displayId} \u2022 by ${player}`}
        </div>

        {/* Brand */}
        <div style={{ display: "flex", fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(20,184,166,0.30)", alignSelf: "flex-end" }}>
          CHESSCITO
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: SUCCESS_HEADERS,
      ...(cinzelData ? {
        fonts: [{
          name: "Cinzel",
          data: cinzelData,
          weight: 700 as const,
          style: "normal" as const,
        }],
      } : {}),
    },
  );
}
