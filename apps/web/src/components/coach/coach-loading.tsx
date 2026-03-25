"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap } from "lucide-react";
import { COACH_COPY } from "@/lib/content/editorial";
import type { CoachResponse } from "@/lib/coach/types";

const TIMEOUT_MS = 60_000;

type Props = {
  jobId: string;
  wallet?: string;
  onReady: (response: CoachResponse) => void;
  onFailed: (reason: string) => void;
  onCancel?: () => void;
};

export function CoachLoading({ jobId, wallet, onReady, onFailed, onCancel }: Props) {
  const [dots, setDots] = useState(".");
  const onReadyRef = useRef(onReady);
  const onFailedRef = useRef(onFailed);

  onReadyRef.current = onReady;
  onFailedRef.current = onFailed;

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);

    const pollInterval = setInterval(async () => {
      try {
        const params = wallet ? `?wallet=${wallet}` : "";
        const res = await fetch(`/api/coach/job/${jobId}${params}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "ready") {
          clearInterval(pollInterval);
          onReadyRef.current(data.response);
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          onFailedRef.current(data.reason ?? "Unknown error");
        }
      } catch { /* retry on next poll */ }
    }, 3000);

    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      onFailedRef.current("Timed out waiting for coach response");
    }, TIMEOUT_MS);

    return () => {
      clearInterval(dotInterval);
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [jobId, wallet]);

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12">
      <GraduationCap className="h-12 w-12 text-emerald-400/60 animate-pulse" />
      <p className="text-lg font-semibold text-white">{COACH_COPY.analyzing}{dots}</p>
      <p className="text-sm text-cyan-100/40">{COACH_COPY.reviewingMoves}</p>
      <p className="mt-4 text-xs text-cyan-100/30">{COACH_COPY.canLeave}</p>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 min-h-[44px] text-xs text-cyan-100/40 underline transition-colors hover:text-cyan-100/70"
        >
          {COACH_COPY.cancel}
        </button>
      )}
    </div>
  );
}
