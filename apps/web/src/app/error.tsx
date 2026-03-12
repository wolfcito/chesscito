"use client";

import { ERROR_PAGE_COPY } from "@/lib/content/editorial";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-bold text-cyan-50">{ERROR_PAGE_COPY.title}</h2>
      <p className="text-sm text-cyan-100/60">
        {error.message || ERROR_PAGE_COPY.fallback}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
      >
        {ERROR_PAGE_COPY.tryAgain}
      </button>
    </div>
  );
}
