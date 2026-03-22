"use client";

import { ARENA_COPY, VICTORY_CLAIM_COPY, VICTORY_CELEBRATION_COPY } from "@/lib/content/editorial";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import { StatCard } from "@/components/arena/stat-card";
import { formatTime } from "@/lib/game/arena-utils";
import sparklesData from "@/../public/animations/sparkles.json";
import trophyData from "@/../public/animations/trophy.json";

type Props = {
  moves: number;
  elapsedMs: number;
  difficulty: string;
  onPlayAgain?: () => void;
  onBackToHub?: () => void;
};

export function VictoryClaiming({
  moves,
  elapsedMs,
  difficulty,
}: Props) {
  const time = formatTime(elapsedMs);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-scrim)] animate-in fade-in duration-300"
      role="alert"
      aria-live="assertive"
    >
      {/* Sparkles background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <LottieAnimation animationData={sparklesData} className="h-full w-full opacity-[0.18]" />
      </div>

      {/* Card — same layout as ready state */}
      <div className="relative z-10 mx-4 flex w-full max-w-[340px] flex-col items-center rounded-3xl border border-white/[0.08] bg-[var(--surface-frosted)] px-6 pb-6 pt-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(20,184,166,0.08)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">

        {/* Hero — Trophy */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.18)_0%,rgba(217,180,74,0.06)_50%,transparent_70%)]" />
          <div className="relative h-32 w-32">
            <LottieAnimation animationData={trophyData} loop={false} className="h-full w-full" />
          </div>
        </div>

        {/* Title */}
        <h2 className="fantasy-title mb-1 text-3xl font-bold text-emerald-300/90 drop-shadow-[0_0_12px_rgba(20,184,166,0.35)]">
          {VICTORY_CELEBRATION_COPY.title}
        </h2>

        {/* Performance summary */}
        <p className="mb-5 text-sm text-cyan-100/50">
          {VICTORY_CELEBRATION_COPY.performanceLineCheckmate(moves, time)}
        </p>

        {/* Stats — 3 mini-cards */}
        <div className="mb-6 flex w-full gap-2">
          <StatCard icon="⚔" value={ARENA_COPY.difficulty[difficulty as keyof typeof ARENA_COPY.difficulty] ?? difficulty} label={VICTORY_CELEBRATION_COPY.stats.difficulty} />
          <StatCard icon="♟" value={String(moves)} label={VICTORY_CELEBRATION_COPY.stats.moves} />
          <StatCard icon="⏱" value={time} label={VICTORY_CELEBRATION_COPY.stats.time} />
        </div>

        {/* Claiming state CTAs */}
        <div className="flex w-full flex-col items-center gap-3">
          {/* Disabled claiming button */}
          <button
            type="button"
            disabled
            className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.08] py-3 text-sm font-bold text-emerald-300/80 shadow-[0_0_20px_rgba(52,211,153,0.12)] animate-pulse"
          >
            {VICTORY_CLAIM_COPY.claiming}
          </button>

          {/* Progress text */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[0.65rem] text-cyan-100/40">{VICTORY_CLAIM_COPY.claimProgress1}</p>
            <p className="text-[0.65rem] text-cyan-100/30">{VICTORY_CLAIM_COPY.claimProgress2}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
