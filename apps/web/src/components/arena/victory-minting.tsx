"use client";

import { VICTORY_CELEBRATION_COPY } from "@/lib/content/editorial";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import sparklesLoadingData from "@/../public/animations/sparkles-loading.json";

export function VictoryMinting() {
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-200"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0b1628]/90 px-12 py-10 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.1)] animate-in zoom-in-95 duration-300">
        <div className="h-20 w-20">
          <LottieAnimation animationData={sparklesLoadingData} />
        </div>
        <p className="text-lg font-semibold text-amber-200 animate-pulse">
          {VICTORY_CELEBRATION_COPY.mintingMessage}
        </p>
      </div>
    </div>
  );
}
