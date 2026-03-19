import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const W = 1200;
const H = 630;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const moves = searchParams.get("moves") ?? "7";
  const time = searchParams.get("time") ?? "0:16";
  const difficulty = (searchParams.get("difficulty") ?? "EASY").toUpperCase();
  const player = searchParams.get("player") ?? "0xA3...9F";

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
        {/* Headline — CHECKMATE */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "0.06em",
            color: "#5eead4",
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          CHECKMATE
        </div>

        {/* Performance — moves + time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 36,
            fontWeight: 700,
            color: "#f5f5f5",
            letterSpacing: "0.04em",
            marginBottom: 20,
          }}
        >
          {`${moves} MOVES • ${time}`}
        </div>

        {/* Difficulty pill */}
        <div
          style={{
            display: "flex",
            padding: "6px 24px",
            borderRadius: 20,
            border: "1px solid rgba(160,205,225,0.15)",
            background: "rgba(255,255,255,0.04)",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "rgba(160,205,225,0.5)",
            marginBottom: 32,
          }}
        >
          {difficulty}
        </div>

        {/* Challenge line */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            color: "#fbbf24",
            letterSpacing: "0.02em",
            marginBottom: 28,
          }}
        >
          Can you beat this?
        </div>

        {/* Player identity */}
        <div
          style={{
            display: "flex",
            fontSize: 16,
            fontWeight: 400,
            color: "rgba(160,205,225,0.4)",
            marginBottom: 8,
          }}
        >
          {`by ${player}`}
        </div>

        {/* Brand */}
        <div
          style={{
            display: "flex",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "rgba(20,184,166,0.35)",
          }}
        >
          CHESSCITO
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
