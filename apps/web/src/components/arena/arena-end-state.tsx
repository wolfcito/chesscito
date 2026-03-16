"use client";

import { ARENA_COPY } from "@/lib/content/editorial";
import type { ArenaStatus } from "@/lib/game/types";

type Props = {
  status: ArenaStatus;
  isPlayerWin: boolean;
  onPlayAgain: () => void;
  onBackToHub: () => void;
};

function getResultText(status: ArenaStatus, isPlayerWin: boolean): string {
  switch (status) {
    case "checkmate":
      return isPlayerWin
        ? ARENA_COPY.endState.checkmate.win
        : ARENA_COPY.endState.checkmate.lose;
    case "stalemate":
      return ARENA_COPY.endState.stalemate;
    case "draw":
      return ARENA_COPY.endState.draw;
    case "resigned":
      return ARENA_COPY.endState.resigned;
    default:
      return "";
  }
}

export function ArenaEndState({ status, isPlayerWin, onPlayAgain, onBackToHub }: Props) {
  const text = getResultText(status, isPlayerWin);
  if (!text) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="alert" aria-live="assertive">
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-slate-800/95 p-8 animate-in zoom-in-90 duration-300">
        <h2 className={`text-2xl font-bold ${isPlayerWin ? "text-emerald-300" : "text-rose-300"}`}>
          {text}
        </h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-xl bg-cyan-500 px-6 py-2.5 font-semibold text-white transition-all hover:bg-cyan-400 active:scale-95"
          >
            {ARENA_COPY.playAgain}
          </button>
          <button
            type="button"
            onClick={onBackToHub}
            className="rounded-xl bg-white/10 px-6 py-2.5 font-semibold text-white/80 transition-all hover:bg-white/20 active:scale-95"
          >
            {ARENA_COPY.backToHub}
          </button>
        </div>
      </div>
    </div>
  );
}
