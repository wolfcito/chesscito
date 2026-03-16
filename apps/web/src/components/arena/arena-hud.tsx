"use client";

import { ARENA_COPY } from "@/lib/content/editorial";
import type { ArenaDifficulty } from "@/lib/game/types";

type Props = {
  difficulty: ArenaDifficulty;
  isThinking: boolean;
};

export function ArenaHud({ difficulty, isThinking }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span className="text-sm font-semibold text-white/80">
        ♟ {ARENA_COPY.difficulty[difficulty]}
      </span>
      <span aria-live="polite" className="text-sm">
        {isThinking && (
          <span className="animate-pulse text-amber-300">
            {ARENA_COPY.aiThinking}
          </span>
        )}
      </span>
    </div>
  );
}
