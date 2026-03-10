# Share Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the ResultOverlay success screen with stars display and branding footer so it looks share-worthy when screenshotted.

**Architecture:** Add `totalStars` prop to `ResultOverlay`, render a `StarsRow` inline component for badge/score variants, and add a small branding footer for all success variants. Pass `totalStars` from `page.tsx` via the existing `useExerciseProgress` hook.

**Tech Stack:** React, Tailwind CSS, existing editorial constants

---

## Task 1: Add `totalStars` prop and stars row to ResultOverlay

**Files:**
- Modify: `apps/web/src/components/play-hub/result-overlay.tsx`

**Step 1: Add `totalStars` to props type**

In the `ResultOverlayProps` type (line 10-19), add after `onRetry?: () => void;`:

```typescript
totalStars?: number;
```

**Step 2: Add the `totalStars` prop to the destructured params**

In the `ResultOverlay` function signature (line 71-80), add `totalStars` to the destructured props.

**Step 3: Add StarsRow inline component**

Add this before the `ResultOverlay` export function (before line 71):

```typescript
const EXERCISES_PER_PIECE = 5;
const MAX_STARS = EXERCISES_PER_PIECE * 3;

function StarsRow({ totalStars }: { totalStars: number }) {
  const filled = Math.min(EXERCISES_PER_PIECE, Math.ceil(totalStars / 3));
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: EXERCISES_PER_PIECE }, (_, i) => (
        <span
          key={i}
          className={i < filled ? "text-amber-400" : "text-amber-400/30"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-cyan-100/70">
        {totalStars}/{MAX_STARS}
      </span>
    </div>
  );
}
```

**Step 4: Render StarsRow in the overlay**

Between the subtitle `<p>` and the CeloScan link (after line 110), add:

```typescript
{/* Stars (badge/score only) */}
{!isError && variant !== "shop" && totalStars != null ? (
  <StarsRow totalStars={totalStars} />
) : null}
```

**Step 5: Commit**

```bash
git add apps/web/src/components/play-hub/result-overlay.tsx
git commit -m "feat(ui): add stars display to ResultOverlay for share card"
```

---

## Task 2: Add branding footer to ResultOverlay

**Files:**
- Modify: `apps/web/src/components/play-hub/result-overlay.tsx`

**Step 1: Add branding footer**

Inside the inner `<div>` (the card content), after the CTA buttons `<div>` (after line 147), add:

```typescript
{/* Branding footer (success only) */}
{!isError ? (
  <div className="mt-4 flex flex-col items-center gap-0.5">
    <span className="fantasy-title text-sm text-cyan-100/50">chesscito</span>
    <span className="text-[0.65rem] text-cyan-100/30">on Celo</span>
  </div>
) : null}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/play-hub/result-overlay.tsx
git commit -m "feat(ui): add branding footer to ResultOverlay for screenshots"
```

---

## Task 3: Pass `totalStars` from page.tsx to ResultOverlay

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`

**Step 1: Add `totalStars` prop to ResultOverlay render**

In the `<ResultOverlay>` JSX (around line 614), add the `totalStars` prop. The `useExerciseProgress` hook already returns `totalStars` (destructured at line ~124). Change:

```typescript
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
```

To:

```typescript
<ResultOverlay
  variant={resultOverlay.variant}
  pieceType={selectedPiece}
  itemLabel={selectedItem?.label}
  txHash={resultOverlay.txHash}
  celoscanHref={resultOverlay.txHash ? txLink(chainId, resultOverlay.txHash) : undefined}
  errorMessage={resultOverlay.errorMessage}
  totalStars={totalStars}
  onDismiss={() => setResultOverlay(null)}
  onRetry={resultOverlay.retryAction}
/>
```

Note: `totalStars` is already returned by `useExerciseProgress` (check line ~124 destructuring — if not destructured yet, add it).

**Step 2: Verify `totalStars` is destructured from hook**

Check the `useExerciseProgress` destructuring (line ~124). If `totalStars` is not listed, add it:

```typescript
const {
  progress,
  currentExercise,
  isLastExercise,
  totalStars,        // ← add if missing
  badgeEarned,
  completeExercise,
  advanceExercise,
  goToExercise,
} = useExerciseProgress(selectedPiece);
```

**Step 3: Commit**

```bash
git add apps/web/src/app/play-hub/page.tsx
git commit -m "feat(play-hub): pass totalStars to ResultOverlay for share card"
```

---

## Task 4: Build and verify

**Step 1: Build**

```bash
pnpm --filter web build
```

Expected: no errors.

**Step 2: Visual verify**

Check at `http://localhost:3000/play-hub`:
- Complete exercises → claim badge → overlay should show stars row + branding
- Submit score → overlay should show stars row + branding
- Shop purchase → overlay should show branding (no stars)
- Error → overlay unchanged (no stars, no branding)

---

## Summary

| Task | Files | Effort |
|------|-------|--------|
| 1. Stars row | `result-overlay.tsx` | S |
| 2. Branding footer | `result-overlay.tsx` | S |
| 3. Pass totalStars | `page.tsx` | S |
| 4. Build + verify | — | S |

**Total: 4 tasks, 3 commits, S effort.**
