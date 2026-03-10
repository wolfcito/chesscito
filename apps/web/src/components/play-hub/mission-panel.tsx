"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type PieceOption = {
  key: "rook" | "bishop" | "knight";
  label: string;
  enabled: boolean;
};

type MissionPanelProps = {
  selectedPiece: PieceOption["key"];
  onSelectPiece: (piece: PieceOption["key"]) => void;
  pieces: readonly PieceOption[];
  phase: "ready" | "success" | "failure";
  score: string;
  timeMs: string;
  level: string;
  board: ReactNode;
  starsBar: ReactNode;
  actionPanel: ReactNode;
};

const SELECTED_PIECE_ART: Record<PieceOption["key"], string> = {
  rook: "/art/torre-selected.webp",
  bishop: "/art/alfil-selected.webp",
  knight: "/art/caballo-selected.webp",
};

type FlashConfig = { text: string; accent: string };

const PHASE_FLASH: Record<MissionPanelProps["phase"], FlashConfig | null> = {
  ready: null,
  success: { text: "Well done!", accent: "text-emerald-300" },
  failure: { text: "Try again", accent: "text-rose-300" },
};

function PhaseFlash({ phase }: { phase: MissionPanelProps["phase"] }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const flash = PHASE_FLASH[phase];

  useEffect(() => {
    if (!flash) {
      setVisible(false);
      setFading(false);
      return;
    }

    setVisible(true);
    setFading(false);

    const fadeTimer = setTimeout(() => setFading(true), 700);
    const hideTimer = setTimeout(() => setVisible(false), 1100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [phase, flash]);

  if (!visible || !flash) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4 animate-in zoom-in-90 duration-300">
        <img
          src="/art/favicon-wolf.png"
          alt=""
          aria-hidden="true"
          className="h-20 w-20 drop-shadow-[0_0_20px_rgba(103,232,249,0.5)]"
        />
        <span className={`fantasy-title text-3xl drop-shadow-lg ${flash.accent}`}>
          {flash.text}
        </span>
      </div>
    </div>
  );
}

export function MissionPanel({
  selectedPiece,
  onSelectPiece,
  pieces,
  phase,
  score,
  timeMs,
  level,
  board,
  starsBar,
  actionPanel,
}: MissionPanelProps) {
  return (
    <section className="mission-shell flex h-[100dvh] flex-col overflow-hidden px-3 pb-3 pt-2">
      {/* Top row: piece selector + level badge */}
      <div className="flex shrink-0 items-center gap-2 pb-2">
        {pieces.map((piece) => (
          <button
            key={piece.key}
            type="button"
            disabled={!piece.enabled}
            onClick={() => onSelectPiece(piece.key)}
            className={`relative h-9 min-w-[72px] shrink overflow-hidden rounded-full px-3 text-xs font-semibold uppercase tracking-[0.2em] transition disabled:opacity-40 ${
              selectedPiece === piece.key
                ? "text-cyan-50 shadow-[0_0_20px_rgba(103,232,249,0.45)]"
                : "mission-chip"
            }`}
            style={
              selectedPiece === piece.key
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.42), rgba(2,6,23,0.42)), url("${SELECTED_PIECE_ART[piece.key]}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {piece.label}
          </button>
        ))}

        <span className="ml-auto shrink-0 whitespace-nowrap text-xs text-cyan-300/80 tracking-[0.16em] uppercase">
          Lv {level}
        </span>
      </div>

      {/* Board — fills remaining space */}
      <div className="min-h-0 flex-1">{board}</div>

      {/* Exercise stars */}
      <div className="mt-2 shrink-0">{starsBar}</div>

      {/* Stats bar */}
      <div className="chesscito-stats-bar mt-2 shrink-0">
        <div className="chesscito-stats-item">
          <span className="chesscito-stats-label">SCORE</span>
          <span className="chesscito-stats-value">{score}</span>
        </div>
        <div className="chesscito-stats-item">
          <span className="chesscito-stats-label">TIME</span>
          <span className="chesscito-stats-value">{Number(timeMs) / 1000}s</span>
        </div>
        <div className="chesscito-stats-item">
          <span className="chesscito-stats-label">TARGET</span>
          <span className="chesscito-stats-value">h1</span>
        </div>
      </div>

      {/* Action panel */}
      <div className="mt-2 shrink-0">{actionPanel}</div>

      {/* Fullscreen phase flash — auto-fades */}
      <PhaseFlash phase={phase} />
    </section>
  );
}
