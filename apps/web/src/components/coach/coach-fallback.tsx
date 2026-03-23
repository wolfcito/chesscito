"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARENA_COPY, COACH_COPY } from "@/lib/content/editorial";
import type { BasicCoachResponse } from "@/lib/coach/types";
import { formatTime } from "@/lib/game/arena-utils";

type Props = {
  response: BasicCoachResponse;
  difficulty: string;
  totalMoves: number;
  elapsedMs: number;
  result: string;
  onGetFullAnalysis: () => void;
  onPlayAgain: () => void;
  onBackToHub: () => void;
};

export function CoachFallback({
  response,
  difficulty,
  totalMoves,
  elapsedMs,
  result,
  onGetFullAnalysis,
  onPlayAgain,
  onBackToHub,
}: Props) {
  const time = formatTime(elapsedMs);
  const diffLabel = ARENA_COPY.difficulty[difficulty as keyof typeof ARENA_COPY.difficulty] ?? difficulty;

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <h2 className="fantasy-title text-xl font-bold text-white">{COACH_COPY.quickReviewTitle}</h2>
      <p className="text-xs text-cyan-100/50">{diffLabel} - {totalMoves} moves - {result}</p>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-sm text-cyan-100/70">{response.summary}</p>
      </div>

      {response.tips.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{COACH_COPY.tips}</h3>
          <ul className="flex flex-col gap-1">
            {response.tips.map((t, i) => (
              <li key={i} className="text-sm text-cyan-100/60">- {t}</li>
            ))}
          </ul>
        </section>
      )}

      <Button
        type="button"
        variant="game-solid"
        size="game"
        onClick={onGetFullAnalysis}
        className="border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300"
      >
        <span className="flex flex-col items-center leading-tight">
          <span className="font-bold">{COACH_COPY.getFullAnalysis}</span>
          <span className="text-[0.6rem] text-emerald-200/40">{COACH_COPY.getFullAnalysisSub}</span>
        </span>
      </Button>

      <Button type="button" variant="game-primary" size="game" onClick={onPlayAgain}>
        <RotateCcw size={16} className="inline -mt-0.5" /> {ARENA_COPY.playAgain}
      </Button>
      <Button type="button" variant="game-text" size="game-sm" onClick={onBackToHub}>
        {ARENA_COPY.backToHub}
      </Button>
    </div>
  );
}
