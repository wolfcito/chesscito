"use client";

import { ARENA_COPY, SHARE_COPY, VICTORY_CELEBRATION_COPY, VICTORY_MINT_COPY } from "@/lib/content/editorial";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import { ShareButton } from "@/components/ui/share-button";
import { formatTime } from "@/lib/game/arena-utils";
import sparklesData from "@/../public/animations/sparkles.json";
import trophyData from "@/../public/animations/trophy.json";

type Props = {
  moves: number;
  elapsedMs: number;
  difficulty: string;
  isCheckmate?: boolean;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  onMintVictory?: () => void;
  mintPrice?: string;
  mintError?: string | null;
};

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
      <span className="text-sm leading-none opacity-60">{icon}</span>
      <span className="text-base font-bold leading-none text-white/90">{value}</span>
      <span className="text-[0.6rem] uppercase tracking-widest text-cyan-200/40">{label}</span>
    </div>
  );
}

export function VictoryCelebration({
  moves,
  elapsedMs,
  difficulty,
  isCheckmate = true,
  onPlayAgain,
  onBackToHub,
  onMintVictory,
  mintPrice,
  mintError,
}: Props) {
  const time = formatTime(elapsedMs);
  const shareText = VICTORY_CELEBRATION_COPY.shareTextBasic(moves, SHARE_COPY.url);
  const performanceLine = isCheckmate
    ? VICTORY_CELEBRATION_COPY.performanceLineCheckmate(moves, time)
    : VICTORY_CELEBRATION_COPY.performanceLine(moves, time);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/65 animate-in fade-in duration-300"
      role="alert"
      aria-live="assertive"
    >
      {/* Sparkles — subtle background layer */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <LottieAnimation animationData={sparklesData} className="h-full w-full opacity-[0.18]" />
      </div>

      {/* Card */}
      <div className="relative z-10 mx-4 flex w-full max-w-[340px] flex-col items-center rounded-3xl border border-white/[0.08] bg-[#0a1424]/92 px-6 pb-6 pt-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(20,184,166,0.08)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">

        {/* A. Hero — Trophy with teal/cyan halo */}
        <div className="relative mb-4 flex items-center justify-center">
          {/* Halo glow — teal-cyan base with warm accent */}
          <div className="absolute h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.18)_0%,rgba(217,180,74,0.06)_50%,transparent_70%)]" />
          <div className="relative h-32 w-32">
            <LottieAnimation animationData={trophyData} loop={false} className="h-full w-full" />
          </div>
        </div>

        {/* B. Title */}
        <h2 className="fantasy-title mb-1 text-3xl font-bold text-emerald-300/90 drop-shadow-[0_0_12px_rgba(20,184,166,0.35)]">
          {VICTORY_CELEBRATION_COPY.title}
        </h2>

        {/* C. Performance summary */}
        <p className="mb-5 text-sm text-cyan-100/50">
          {performanceLine}
        </p>

        {/* D. Stats — 3 mini-cards */}
        <div className="mb-6 flex w-full gap-2">
          <StatCard
            icon="⚔"
            value={difficulty.toUpperCase()}
            label={VICTORY_CELEBRATION_COPY.stats.difficulty}
          />
          <StatCard
            icon="♟"
            value={String(moves)}
            label={VICTORY_CELEBRATION_COPY.stats.moves}
          />
          <StatCard
            icon="⏱"
            value={time}
            label={VICTORY_CELEBRATION_COPY.stats.time}
          />
        </div>

        {/* E. CTAs — clear hierarchy */}
        <div className="flex w-full flex-col gap-2.5">
          {/* Primary: Play Again */}
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 py-3 text-sm font-bold text-white shadow-[0_0_16px_rgba(20,184,166,0.25)] transition-all hover:shadow-[0_0_24px_rgba(20,184,166,0.4)] active:scale-[0.97]"
          >
            {ARENA_COPY.playAgain}
          </button>

          {/* Secondary: Mint Victory */}
          {onMintVictory && (
            <button
              type="button"
              onClick={onMintVictory}
              className="w-full rounded-2xl border border-amber-400/25 bg-amber-500/[0.08] py-2.5 text-sm font-semibold text-amber-300/90 transition-all hover:bg-amber-500/[0.14] active:scale-[0.97]"
            >
              {`${VICTORY_MINT_COPY.mintButton} — ${mintPrice ?? ""}`}
            </button>
          )}

          {/* Mint error */}
          {mintError && (
            <p className="text-center text-xs text-rose-300/80">{mintError}</p>
          )}

          {/* Tertiary row: Share + Back */}
          <div className="flex gap-2">
            <ShareButton
              text={shareText}
              url={SHARE_COPY.url}
              label={VICTORY_CELEBRATION_COPY.shareVictory}
              copiedLabel={VICTORY_CELEBRATION_COPY.copiedToast}
              variant="ghost-cyan"
            />
            <button
              type="button"
              onClick={onBackToHub}
              className="flex-1 rounded-2xl py-2.5 text-sm font-medium text-white/35 transition-all hover:text-white/55 active:scale-[0.97]"
            >
              {ARENA_COPY.backToHub}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
