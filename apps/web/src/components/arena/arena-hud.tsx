"use client";

import { Brain } from "lucide-react";
import { ARENA_COPY } from "@/lib/content/editorial";
import type { ArenaDifficulty } from "@/lib/game/types";

type Props = {
  difficulty: ArenaDifficulty;
  isThinking: boolean;
  onBack: () => void;
};

const DOT_COLOR: Record<ArenaDifficulty, string> = {
  easy: "bg-emerald-400",
  medium: "bg-amber-400",
  hard: "bg-rose-400",
};

export function ArenaHud({ difficulty, isThinking, onBack }: Props) {
  return (
    <div className="hud-bar mx-2 mt-2 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white/80 active:scale-95"
        aria-label={ARENA_COPY.backToHub}
      >
        <span className="text-xs">←</span>
        <span className={`h-2 w-2 rounded-full ${DOT_COLOR[difficulty]}`} />
        <span className="font-semibold uppercase tracking-widest text-xs text-white/80">
          {ARENA_COPY.difficulty[difficulty]}
        </span>
      </button>
      <span aria-live="polite" className="text-xs">
        {isThinking && (
          <span className="flex items-center gap-1.5 animate-pulse text-amber-300/90 tracking-wide">
            <Brain className="h-3.5 w-3.5" />
            {ARENA_COPY.aiThinking}
          </span>
        )}
      </span>
    </div>
  );
}
