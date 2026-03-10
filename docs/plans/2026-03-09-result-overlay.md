# Result Overlay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add fullscreen modal feedback for post-transaction success and errors in MiniPay production.

**Architecture:** New `<ResultOverlay />` component triggered by state in `page.tsx` after tx confirmation/error. Uses existing `reward-glow` asset and `reward-burst` CSS keyframe. Editorial copy centralized in `editorial.ts`.

**Tech Stack:** React, Tailwind CSS, existing art assets (avif/webp/png picture pattern)

---

## Task 1: Add editorial copy for Result Overlay

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts`

**Step 1: Add RESULT_OVERLAY_COPY constant**

Add to the end of `editorial.ts`:

```typescript
export const RESULT_OVERLAY_COPY = {
  badge: {
    title: "Badge Claimed!",
    subtitle: (piece: string) => `${piece} Ascendant is now in your wallet`,
  },
  score: {
    title: "Score Recorded!",
    subtitle: "Your score is now on-chain",
  },
  shop: {
    title: "Purchase Complete!",
    subtitle: (item: string) => `${item} acquired — thank you for supporting Chesscito`,
  },
  error: {
    title: "Transaction Failed",
    cancelled: "Transaction was cancelled",
    insufficientFunds: "Not enough funds to complete this transaction",
    network: "Network error — check your connection and try again",
    revert: "Transaction failed — this action may not be available right now",
    unknown: "Something went wrong. Please try again",
  },
  cta: {
    continue: "Continue",
    tryAgain: "Try Again",
    dismiss: "Dismiss",
    viewOnCeloscan: "View on CeloScan",
  },
} as const;
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts
git commit -m "feat(content): add Result Overlay editorial copy"
```

---

## Task 2: Create `<ResultOverlay />` component

**Files:**
- Create: `apps/web/src/components/play-hub/result-overlay.tsx`

**Step 1: Create the component**

```typescript
"use client";

import Link from "next/link";
import { BADGE_TITLES, PIECE_LABELS, RESULT_OVERLAY_COPY } from "@/lib/content/editorial";
import type { PieceKey } from "@/lib/game/types";

type SuccessVariant = "badge" | "score" | "shop";
type Variant = SuccessVariant | "error";

type ResultOverlayProps = {
  variant: Variant;
  pieceType?: PieceKey;
  itemLabel?: string;
  txHash?: string;
  celoscanHref?: string;
  errorMessage?: string;
  onDismiss: () => void;
  onRetry?: () => void;
};

const VARIANT_IMG: Record<SuccessVariant, string> = {
  badge: "/art/piece-rook.png", // overridden by pieceType
  score: "/art/score-chesscito.png",
  shop: "/art/badge-chesscito.png",
};

function getBadgeImg(pieceType?: PieceKey): string {
  const map: Record<PieceKey, string> = {
    rook: "/art/piece-rook.png",
    bishop: "/art/piece-bishop.png",
    knight: "/art/piece-knight.png",
  };
  return map[pieceType ?? "rook"];
}

function getTitle(variant: Variant): string {
  if (variant === "error") return RESULT_OVERLAY_COPY.error.title;
  return RESULT_OVERLAY_COPY[variant].title;
}

function getSubtitle(variant: Variant, pieceType?: PieceKey, itemLabel?: string, errorMessage?: string): string {
  switch (variant) {
    case "badge":
      return RESULT_OVERLAY_COPY.badge.subtitle(
        PIECE_LABELS[pieceType ?? "rook"]
      );
    case "score":
      return RESULT_OVERLAY_COPY.score.subtitle;
    case "shop":
      return RESULT_OVERLAY_COPY.shop.subtitle(itemLabel ?? "Item");
    case "error":
      return errorMessage ?? RESULT_OVERLAY_COPY.error.unknown;
  }
}

function SuccessImage({ variant, pieceType }: { variant: SuccessVariant; pieceType?: PieceKey }) {
  const src = variant === "badge" ? getBadgeImg(pieceType) : VARIANT_IMG[variant];
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow behind image */}
      <div className="absolute h-48 w-48 rounded-full bg-[image:var(--playhub-reward-glow)] bg-contain bg-center bg-no-repeat opacity-70 blur-sm" />
      <picture className="reward-burst relative z-10">
        <source srcSet={src.replace(".png", ".avif")} type="image/avif" />
        <source srcSet={src.replace(".png", ".webp")} type="image/webp" />
        <img src={src} alt="" className="h-32 w-32 object-contain drop-shadow-lg" />
      </picture>
    </div>
  );
}

export function ResultOverlay({
  variant,
  pieceType,
  itemLabel,
  txHash,
  celoscanHref,
  errorMessage,
  onDismiss,
  onRetry,
}: ResultOverlayProps) {
  const isError = variant === "error";
  const title = getTitle(variant);
  const subtitle = getSubtitle(variant, pieceType, itemLabel, errorMessage);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center animate-in zoom-in-95 fade-in duration-400">
        {/* Image or error icon */}
        {isError ? (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-900/40 ring-1 ring-rose-500/40">
            <span className="text-4xl text-rose-400" aria-hidden="true">!</span>
          </div>
        ) : (
          <SuccessImage variant={variant} pieceType={pieceType} />
        )}

        {/* Title */}
        <h2 className={`fantasy-title text-2xl ${isError ? "text-rose-100" : "text-cyan-50"}`}>
          {title}
        </h2>

        {/* Subtitle */}
        <p className={`text-sm leading-relaxed ${isError ? "text-rose-200/80" : "text-cyan-100/80"}`}>
          {subtitle}
        </p>

        {/* CeloScan link (success only) */}
        {!isError && txHash && celoscanHref ? (
          <Link
            href={celoscanHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-cyan-400 underline underline-offset-2"
          >
            {RESULT_OVERLAY_COPY.cta.viewOnCeloscan}
          </Link>
        ) : null}

        {/* CTA buttons */}
        <div className="mt-2 flex w-full flex-col gap-2">
          {isError && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              {RESULT_OVERLAY_COPY.cta.tryAgain}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onDismiss}
            className={
              isError && onRetry
                ? "w-full py-2 text-sm text-cyan-100/60 transition hover:text-cyan-100"
                : "w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
            }
          >
            {isError ? RESULT_OVERLAY_COPY.cta.dismiss : RESULT_OVERLAY_COPY.cta.continue}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/play-hub/result-overlay.tsx
git commit -m "feat(ui): create ResultOverlay component for post-tx feedback"
```

---

## Task 3: Add error classifier utility

**Files:**
- Create: `apps/web/src/lib/errors.ts`

**Step 1: Create error classifier**

```typescript
import { RESULT_OVERLAY_COPY } from "@/lib/content/editorial";

const copy = RESULT_OVERLAY_COPY.error;

export function classifyTxError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied") || lower.includes("cancelled")) {
    return copy.cancelled;
  }
  if (lower.includes("insufficient funds") || lower.includes("exceeds balance")) {
    return copy.insufficientFunds;
  }
  if (lower.includes("network") || lower.includes("timeout") || lower.includes("disconnected")) {
    return copy.network;
  }
  if (lower.includes("revert") || lower.includes("execution reverted")) {
    return copy.revert;
  }
  return copy.unknown;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/errors.ts
git commit -m "feat(errors): add classifyTxError for user-friendly error messages"
```

---

## Task 4: Integrate ResultOverlay into `page.tsx`

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`

**Step 1: Add imports and state**

Add imports near the top of the file (after existing imports):

```typescript
import { ResultOverlay } from "@/components/play-hub/result-overlay";
import { classifyTxError } from "@/lib/errors";
```

Add state after `const [purchasePhase, ...]` (around line 112):

```typescript
const [resultOverlay, setResultOverlay] = useState<{
  variant: "badge" | "score" | "shop" | "error";
  txHash?: string;
  errorMessage?: string;
  retryAction?: () => void;
} | null>(null);
```

**Step 2: Modify `handleClaimBadge()`**

In the `try` block, after `setClaimTxHash(txHash)` and `void refetchClaimedBadge()`, add:

```typescript
setResultOverlay({
  variant: "badge",
  txHash,
});
```

In the `catch` block, replace `setLastError(message)` with:

```typescript
setLastError(message);
setResultOverlay({
  variant: "error",
  errorMessage: classifyTxError(error),
  retryAction: () => void handleClaimBadge(),
});
```

**Step 3: Modify `handleSubmitScore()`**

In the `try` block, after `setSubmitTxHash(txHash)`, add:

```typescript
setResultOverlay({
  variant: "score",
  txHash,
});
```

In the `catch` block, replace `setLastError(message)` with:

```typescript
setLastError(message);
setResultOverlay({
  variant: "error",
  errorMessage: classifyTxError(error),
  retryAction: () => void handleSubmitScore(),
});
```

**Step 4: Modify `handleConfirmPurchase()`**

In the `try` block, after `setShopTxHash(buyHash)` and `setConfirmOpen(false)`, add:

```typescript
setResultOverlay({
  variant: "shop",
  txHash: buyHash,
});
```

In the `catch` block, after `setLastError(message)`, add:

```typescript
setResultOverlay({
  variant: "error",
  errorMessage: classifyTxError(error),
});
```

**Step 5: Render ResultOverlay**

Add before the closing `</main>` tag (before line ~582), alongside the existing `PurchaseConfirmSheet`:

```typescript
{resultOverlay ? (
  <ResultOverlay
    variant={resultOverlay.variant}
    pieceType={selectedPiece}
    itemLabel={selectedItem?.label}
    txHash={resultOverlay.txHash}
    celoscanHref={resultOverlay.txHash ? txLink(chainId, resultOverlay.txHash) : undefined}
    errorMessage={resultOverlay.errorMessage}
    onDismiss={() => setResultOverlay(null)}
    onRetry={resultOverlay.retryAction}
  />
) : null}
```

**Step 6: Commit**

```bash
git add apps/web/src/app/play-hub/page.tsx
git commit -m "feat(play-hub): integrate ResultOverlay for badge, score, shop, and error feedback"
```

---

## Task 5: Verify build and capture screenshots

**Step 1: Build**

```bash
pnpm --filter web build
```

Expected: no errors, no warnings.

**Step 2: Capture UX review**

```bash
node .tmp/capture-ux-review.cjs
```

Manually verify in browser at `http://localhost:3000/play-hub`:
- Complete an exercise → claim badge → should see fullscreen overlay with badge image + glow
- Trigger an error (disconnect wallet mid-tx) → should see error overlay with friendly message

**Step 3: Final commit with any tweaks**

```bash
git commit -m "fix(ui): adjust ResultOverlay after visual review"
```

---

## Summary

| Task | Files | Effort |
|------|-------|--------|
| 1. Editorial copy | `editorial.ts` | S |
| 2. ResultOverlay component | `result-overlay.tsx` (new) | M |
| 3. Error classifier | `errors.ts` (new) | S |
| 4. Integration in page.tsx | `page.tsx` | M |
| 5. Build + visual verify | — | S |

**Total: 5 tasks, ~4 commits, estimated S-M effort.**
