# Badge Earned Prompt Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prompt users to claim their badge when they earn it, instead of silently auto-advancing past the claim window.

**Architecture:** New `BadgeEarnedPrompt` component (same file as ResultOverlay, reuses shared internals). Detect `badgeEarned` transition in `page.tsx` via useRef, cancel auto-advance timer, show prompt. Add pulsing notification dot to action buttons as fallback reminder.

**Tech Stack:** React, Tailwind CSS, existing components

---

## Task 1: Add editorial copy for Badge Earned Prompt

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts`

**Step 1: Add BADGE_EARNED_COPY constant**

Add after `RESULT_OVERLAY_COPY`:

```typescript
export const BADGE_EARNED_COPY = {
  title: (piece: string) => `${piece} Ascendant Earned`,
  claimBadge: "Claim Badge",
  submitScore: "Submit Score",
  later: "Later",
} as const;
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts
git commit -m "feat(content): add Badge Earned Prompt editorial copy"
```

---

## Task 2: Create `BadgeEarnedPrompt` component

**Files:**
- Modify: `apps/web/src/components/play-hub/result-overlay.tsx`

**Step 1: Add import for BADGE_EARNED_COPY**

Update the import line to include `BADGE_EARNED_COPY`:

```typescript
import { BADGE_EARNED_COPY, PIECE_LABELS, RESULT_OVERLAY_COPY } from "@/lib/content/editorial";
```

**Step 2: Add the BadgeEarnedPrompt export**

Add after the `ResultOverlay` export function (at end of file):

```typescript
type BadgeEarnedPromptProps = {
  pieceType: PieceKey;
  totalStars: number;
  onClaimBadge: () => void;
  onSubmitScore: () => void;
  onLater: () => void;
};

export function BadgeEarnedPrompt({
  pieceType,
  totalStars,
  onClaimBadge,
  onSubmitScore,
  onLater,
}: BadgeEarnedPromptProps) {
  const title = BADGE_EARNED_COPY.title(PIECE_LABELS[pieceType]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center animate-in zoom-in-95 fade-in duration-400">
        <SuccessImage variant="badge" pieceType={pieceType} />

        <StarsRow totalStars={totalStars} />

        <h2 className="fantasy-title text-2xl text-cyan-50">{title}</h2>

        <div className="mt-2 flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={onClaimBadge}
            className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            {BADGE_EARNED_COPY.claimBadge}
          </button>
          <button
            type="button"
            onClick={onSubmitScore}
            className="w-full rounded-xl bg-cyan-600/60 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            {BADGE_EARNED_COPY.submitScore}
          </button>
          <button
            type="button"
            onClick={onLater}
            className="w-full py-2 text-sm text-cyan-100/60 transition hover:text-cyan-100"
          >
            {BADGE_EARNED_COPY.later}
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center gap-0.5">
          <span className="fantasy-title text-sm text-cyan-100/50">chesscito</span>
          <span className="text-[0.65rem] text-cyan-100/30">on Celo</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/components/play-hub/result-overlay.tsx
git commit -m "feat(ui): add BadgeEarnedPrompt component for pre-tx claim prompt"
```

---

## Task 3: Add notification dot to action buttons

**Files:**
- Modify: `apps/web/src/components/play-hub/onchain-actions-panel.tsx`

**Step 1: Add `showNotification` prop to ActionBtn**

Add `showNotification?: boolean` to the ActionBtn parameter type (after `variant`).

**Step 2: Render the dot inside ActionBtn**

Inside the `<button>` element, after the `{busy ? ... : ...}` ternary, add:

```typescript
{showNotification && !disabled && !busy ? (
  <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
  </span>
) : null}
```

**Step 3: Pass showNotification to badge and score buttons**

On the badge `ActionBtn` (the one with `icon="/art/badge-chesscito.png"`), add:
```typescript
showNotification={canClaim}
```

On the score `ActionBtn` (the one with `icon="/art/score-chesscito.png"`), add:
```typescript
showNotification={canSubmit}
```

**Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/onchain-actions-panel.tsx
git commit -m "feat(ui): add pulsing notification dot to badge and score action buttons"
```

---

## Task 4: Integrate BadgeEarnedPrompt into page.tsx

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`

**Step 1: Add import**

Add `BadgeEarnedPrompt` to the import from result-overlay:

```typescript
import { BadgeEarnedPrompt, ResultOverlay } from "@/components/play-hub/result-overlay";
```

Also add `useRef` to the react import if not already there (it is — check line 3), and import `computeStars` and `totalStars as totalStarsFn` from scoring:

```typescript
import { computeStars, totalStars as totalStarsFn } from "@/lib/game/scoring";
```

And import `BADGE_THRESHOLD` from exercises:

```typescript
import { BADGE_THRESHOLD } from "@/lib/game/exercises";
```

**Step 2: Add state for badge earned prompt**

After the `resultOverlay` state (around line 120), add:

```typescript
const [showBadgeEarned, setShowBadgeEarned] = useState(false);
```

**Step 3: Modify handleMove to detect badge threshold crossing**

In `handleMove`, after `completeExercise(movesCount)` (line 309), and BEFORE the `autoResetTimer.current = setTimeout(...)` block, add logic to check if this move just crossed the badge threshold:

```typescript
// Check if this exercise completion earns the badge
const newStars = computeStars(movesCount, currentExercise.optimalMoves);
const prevStarValue = progress.stars[progress.exerciseIndex];
const starDelta = Math.max(0, newStars - prevStarValue);
const newTotal = totalStars + starDelta;
const justEarnedBadge = newTotal >= BADGE_THRESHOLD && totalStars < BADGE_THRESHOLD;

if (justEarnedBadge) {
  setShowBadgeEarned(true);
  return; // Don't start auto-advance timer
}
```

Note: `totalStars` here is the value from the hook BEFORE this exercise was completed. `completeExercise` updates localStorage but the React state hasn't re-rendered yet, so `totalStars` still reflects the pre-completion value. We compute the delta inline.

**Step 4: Add handleBadgeEarnedDismiss function**

After `handleMove`, add:

```typescript
function handleBadgeEarnedDismiss() {
  setShowBadgeEarned(false);
  // Resume auto-advance logic
  autoResetTimer.current = setTimeout(() => {
    if (!isLastExercise) {
      advanceExercise();
      resetBoard();
    } else if (nextPiece) {
      setSelectedPiece(nextPiece);
      resetBoard();
    }
  }, 500);
}
```

**Step 5: Render BadgeEarnedPrompt**

Before the `{resultOverlay ? (` block (around line 613), add:

```typescript
{showBadgeEarned ? (
  <BadgeEarnedPrompt
    pieceType={selectedPiece}
    totalStars={totalStars}
    onClaimBadge={() => {
      setShowBadgeEarned(false);
      void handleClaimBadge();
    }}
    onSubmitScore={() => {
      setShowBadgeEarned(false);
      void handleSubmitScore();
    }}
    onLater={handleBadgeEarnedDismiss}
  />
) : null}
```

**Step 6: Verify BADGE_THRESHOLD is exported**

Check `apps/web/src/lib/game/exercises.ts` — if `BADGE_THRESHOLD` is not exported, export it. It should be `export const BADGE_THRESHOLD = 10;`.

**Step 7: Commit**

```bash
git add apps/web/src/app/play-hub/page.tsx
git commit -m "feat(play-hub): intercept auto-advance with BadgeEarnedPrompt on badge threshold"
```

---

## Task 5: Build and verify

**Step 1: Build**

```bash
pnpm --filter web build
```

Expected: no errors.

**Step 2: Visual verify**

At `http://localhost:3000/play-hub`:
- Complete exercises until total stars >= 10 → BadgeEarnedPrompt should appear
- Auto-advance should NOT fire while prompt is visible
- "Claim Badge" → triggers tx → ResultOverlay success
- "Later" → dismisses prompt → auto-advance resumes
- After "Later", badge button should show pulsing amber dot
- Score button should show pulsing dot when canSubmit is true

---

## Summary

| Task | Files | Effort |
|------|-------|--------|
| 1. Editorial copy | `editorial.ts` | S |
| 2. BadgeEarnedPrompt component | `result-overlay.tsx` | S |
| 3. Notification dot | `onchain-actions-panel.tsx` | S |
| 4. Integration in page.tsx | `page.tsx` | M |
| 5. Build + verify | — | S |

**Total: 5 tasks, 4 commits, S-M effort.**
