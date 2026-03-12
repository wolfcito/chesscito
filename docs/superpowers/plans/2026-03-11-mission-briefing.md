# Mission Briefing Overlay Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fading tutorial banner with a mission briefing overlay (modal card over dimmed board) before each exercise, plus a persistent piece hint during gameplay.

**Architecture:** New `MissionBriefing` component renders a fullscreen scrim + frosted card with avatar, mission text, and PLAY button. It appears on every exercise start and closes with a shrink+fade animation. The old `TutorialBanner` is replaced by a static one-line `pieceHint` below the HUD that never collapses.

**Tech Stack:** React, Tailwind CSS, CSS keyframes

**Design doc:** `docs/plans/2026-03-11-mission-briefing-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/src/components/play-hub/mission-briefing.tsx` | **Create** | Mission briefing overlay component |
| `apps/web/src/lib/content/editorial.ts` | **Modify** | Add `MISSION_BRIEFING_COPY`, keep `TUTORIAL_COPY` and `CAPTURE_COPY` for backward compat |
| `apps/web/src/app/globals.css` | **Modify** | Add briefing CSS, remove tutorial banner CSS |
| `apps/web/src/components/play-hub/mission-panel.tsx` | **Modify** | Replace `tutorialBanner` prop with `pieceHint` prop |
| `apps/web/src/app/play-hub/page.tsx` | **Modify** | Add `showBriefing` state, remove tutorial states, wire MissionBriefing |

---

## Chunk 1: New Component + Editorial Copy

### Task 1: Add mission briefing copy to editorial.ts

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts`

- [ ] **Step 1: Add `MISSION_BRIEFING_COPY` constant after `PASSPORT_COPY`**

```ts
export const MISSION_BRIEFING_COPY = {
  label: "MISSION",
  play: "PLAY",
  moveHint: {
    rook: "The Rook moves in straight lines",
    bishop: "The Bishop moves diagonally",
    knight: "The Knight jumps in an L-shape",
  },
  captureHint: "Capture the target piece",
  pieceHint: {
    rook: "♜ Straight lines",
    bishop: "♝ Diagonal moves",
    knight: "♞ L-shaped jumps",
  },
  captureHintCompact: "♜ Capture the target",
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts
git commit -m "feat(editorial): add mission briefing copy"
```

---

### Task 2: Create MissionBriefing component

**Files:**
- Create: `apps/web/src/components/play-hub/mission-briefing.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { MISSION_BRIEFING_COPY } from "@/lib/content/editorial";
import type { PieceId } from "@/lib/game/types";

type MissionBriefingProps = {
  pieceType: PieceId;
  targetLabel: string;
  isCapture: boolean;
  onPlay: () => void;
};

export function MissionBriefing({
  pieceType,
  targetLabel,
  isCapture,
  onPlay,
}: MissionBriefingProps) {
  const [exiting, setExiting] = useState(false);

  const objective = isCapture
    ? MISSION_BRIEFING_COPY.captureHint
    : `Move your ${pieceType.charAt(0).toUpperCase() + pieceType.slice(1)} to ${targetLabel}`;
  const hint = MISSION_BRIEFING_COPY.moveHint[pieceType];

  function handlePlay() {
    setExiting(true);
    setTimeout(onPlay, 400);
  }

  return (
    <div
      className={`mission-briefing-scrim ${exiting ? "is-exiting" : ""}`}
      aria-modal="true"
      role="dialog"
    >
      <div className={`mission-briefing-card ${exiting ? "is-exiting" : ""}`}>
        <img
          src="/art/favicon-wolf.png"
          alt=""
          aria-hidden="true"
          className="mx-auto mb-4 h-20 w-20 rounded-full drop-shadow-[0_0_24px_rgba(103,232,249,0.3)]"
        />
        <p className="mb-1.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-cyan-400">
          {MISSION_BRIEFING_COPY.label}
        </p>
        <p className="text-center text-sm font-medium text-slate-100">
          {objective}
        </p>
        <p className="mt-1.5 text-center text-[11px] text-cyan-100/45">
          {hint}
        </p>
        <button
          type="button"
          onClick={handlePlay}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 py-3 text-sm font-bold tracking-wide text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition active:scale-95"
        >
          {MISSION_BRIEFING_COPY.play}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/play-hub/mission-briefing.tsx
git commit -m "feat(play-hub): create MissionBriefing overlay component"
```

---

### Task 3: Add mission briefing CSS + remove old tutorial banner CSS

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Add mission briefing CSS**

Add after the existing `.playhub-board-piece-img` block (around line 465):

```css
  /* Mission briefing overlay */
  .mission-briefing-scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 20, 25, 0.70);
    animation: mission-briefing-fade-in 300ms ease-out;
  }

  .mission-briefing-scrim.is-exiting {
    animation: mission-briefing-fade-out 400ms ease-in forwards;
  }

  .mission-briefing-card {
    width: 85%;
    max-width: 280px;
    background: rgba(2, 12, 24, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(103, 232, 249, 0.25);
    border-radius: 20px;
    padding: 28px 24px 24px;
    animation: mission-briefing-card-in 400ms ease-out;
  }

  .mission-briefing-card.is-exiting {
    animation: mission-briefing-card-exit 400ms ease-in forwards;
  }

  /* Persistent piece hint */
  .piece-hint {
    text-align: center;
    font-size: 11px;
    color: rgba(207, 250, 254, 0.5);
    padding: 6px 0;
    min-height: 28px;
  }
```

- [ ] **Step 2: Add keyframes outside the `@layer base {}` block (after the existing `tutorial-banner-out` keyframes)**

```css
@keyframes mission-briefing-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes mission-briefing-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes mission-briefing-card-in {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes mission-briefing-card-exit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}
```

- [ ] **Step 3: Remove old tutorial banner CSS**

Remove the `.tutorial-banner` block (lines ~532-544) and the `@keyframes tutorial-banner-in` and `@keyframes tutorial-banner-out` blocks (lines ~547-566).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style(play-hub): add mission briefing CSS, remove tutorial banner CSS"
```

---

## Chunk 2: Integration — Wire MissionPanel + page.tsx

### Task 4: Update MissionPanel — replace tutorialBanner with pieceHint

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx`

- [ ] **Step 1: Replace `tutorialBanner` prop with `pieceHint` in the type**

Change in `MissionPanelProps`:
```ts
  tutorialBanner?: ReactNode;
```
To:
```ts
  pieceHint?: string;
```

- [ ] **Step 2: Update the destructured props**

Change in the function signature:
```ts
  tutorialBanner,
```
To:
```ts
  pieceHint,
```

- [ ] **Step 3: Replace the tutorialBanner slot in Zone 2**

Change:
```tsx
        {/* Fixed-height slot so the board never shifts when the banner fades */}
        <div className="min-h-[32px]">{tutorialBanner}</div>
```

To:
```tsx
        {pieceHint ? <p className="piece-hint">{pieceHint}</p> : null}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "refactor(mission-panel): replace tutorialBanner with pieceHint"
```

---

### Task 5: Wire everything in page.tsx

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`

This is the largest task — it removes old tutorial state, adds briefing state, and wires the new component.

- [ ] **Step 1: Add import for MissionBriefing and MISSION_BRIEFING_COPY**

Add at the top imports:
```ts
import { MissionBriefing } from "@/components/play-hub/mission-briefing";
```

Change the editorial import to include `MISSION_BRIEFING_COPY`:
```ts
import { ..., MISSION_BRIEFING_COPY } from "@/lib/content/editorial";
```

- [ ] **Step 2: Replace tutorial states with briefing state**

Remove these state declarations (lines ~161-162):
```ts
  const [showTutorial, setShowTutorial] = useState(false);
  const [captureHintSeen, setCaptureHintSeen] = useState(false);
```

Add:
```ts
  const [showBriefing, setShowBriefing] = useState(true);
```

- [ ] **Step 3: Remove the tutorial useEffect and dismissTutorial function**

Remove the `useEffect` that reads localStorage for `chesscito:tutorial:rook` (lines ~204-214).

Remove the `dismissTutorial` function (lines ~216-219).

Remove the `tutorialHints` useMemo (lines ~222-225).

Remove the `showCaptureHint` computed value (line ~227).

- [ ] **Step 4: Show briefing on exercise change**

In the existing `resetBoard` function, add `setShowBriefing(true)`:
```ts
  function resetBoard() {
    if (autoResetTimer.current) clearTimeout(autoResetTimer.current);
    setBoardKey((previous) => previous + 1);
    setPhase("ready");
    setMoves(0);
    setElapsedMs(0);
    setShowBriefing(true);
  }
```

Also add it when piece changes — in `onSelectPiece` callback (line ~656):
```ts
          onSelectPiece={(piece) => {
            setSelectedPiece(piece);
            resetBoard();
          }}
```
`resetBoard()` already sets `showBriefing(true)` so this is covered.

For auto-advance after success (lines ~419-425), `advanceExercise()` is followed by `resetBoard()` which will set `showBriefing(true)`.

- [ ] **Step 5: Remove `dismissTutorial()` call from handleMove**

In `handleMove` (line ~391), remove:
```ts
    dismissTutorial();
    if (!captureHintSeen && currentExercise.isCapture) {
      setCaptureHintSeen(true);
    }
```

- [ ] **Step 6: Replace tutorialBanner variable with pieceHint**

Remove the `tutorialBanner` variable (lines ~643-647):
```ts
  const tutorialBanner = showTutorial ? (
    <TutorialBanner text={TUTORIAL_COPY[selectedPiece]} />
  ) : showCaptureHint ? (
    <TutorialBanner text={CAPTURE_COPY.tutorialBanner} />
  ) : null;
```

Add:
```ts
  const pieceHint = currentExercise.isCapture
    ? MISSION_BRIEFING_COPY.captureHintCompact
    : MISSION_BRIEFING_COPY.pieceHint[selectedPiece];
```

- [ ] **Step 7: Update MissionPanel props**

Change:
```tsx
          tutorialBanner={tutorialBanner}
```

To:
```tsx
          pieceHint={pieceHint}
```

- [ ] **Step 8: Remove `tutorialHints` prop from Board**

Find where `<Board>` is rendered and remove the `tutorialHints={tutorialHints}` prop (if present). The cyan lane highlights were tied to the old tutorial system.

- [ ] **Step 9: Add MissionBriefing overlay**

Add right before the `{showBadgeEarned ? ...}` block (around line ~767):

```tsx
        {showBriefing ? (
          <MissionBriefing
            pieceType={selectedPiece}
            targetLabel={targetLabel}
            isCapture={Boolean(currentExercise.isCapture)}
            onPlay={() => setShowBriefing(false)}
          />
        ) : null}
```

- [ ] **Step 10: Remove the `TutorialBanner` component**

Delete the `TutorialBanner` function component (lines ~115-128).

Also remove the `computeRookLanes` function (lines ~103-113) if no longer used elsewhere.

- [ ] **Step 11: Clean up unused imports**

Remove `TUTORIAL_COPY` and `CAPTURE_COPY` from the editorial import if no longer used in page.tsx. Keep `CAPTURE_COPY` if the `statsLabel` is still used for the target label (line ~640).

Check: `CAPTURE_COPY.statsLabel` is used at line ~640 → keep `CAPTURE_COPY` import.
`TUTORIAL_COPY` is no longer used → remove from import.

- [ ] **Step 12: Commit**

```bash
git add apps/web/src/app/play-hub/page.tsx
git commit -m "feat(play-hub): wire MissionBriefing overlay and persistent piece hint

Replaces fading tutorial banner with fullscreen mission briefing
before each exercise and a static piece hint during gameplay.
Removes TutorialBanner, dismissTutorial, showTutorial state,
captureHintSeen state, and computeRookLanes."
```

---

## Chunk 3: Verification

### Task 6: Manual verification

- [ ] **Step 1: Start dev server**

Run: `cd apps/web && pnpm dev`

- [ ] **Step 2: Open play-hub**

Expected: Mission briefing overlay appears with wolf avatar, "MISSION" label, "Move your Rook to h1", piece hint, and PLAY button. Board visible but dimmed behind.

- [ ] **Step 3: Press PLAY**

Expected: Overlay shrinks to center and fades out (~400ms). Board becomes interactive. Persistent piece hint "♜ Straight lines" visible below HUD.

- [ ] **Step 4: Complete exercise — verify briefing reappears**

Make a move to the target square. After success flash + auto-advance, the briefing should appear again for the next exercise with the new target.

- [ ] **Step 5: Switch piece (Bishop tab)**

Expected: Board resets, briefing appears with bishop-specific text: "Move your Bishop to [target]" and "The Bishop moves diagonally".

- [ ] **Step 6: Verify capture exercise briefing**

Navigate to rook exercise 4 or 5 (capture exercises). Expected: Briefing shows "Capture the target piece". Piece hint shows "♜ Capture the target".

- [ ] **Step 7: TypeScript check**

Run: `npx tsc --noEmit` — expected: no errors.

- [ ] **Step 8: Take Playwright screenshot for comparison**

```bash
npx playwright screenshot --viewport-size="390,844" --wait-for-timeout=3000 "http://localhost:3000/play-hub" /tmp/chesscito-briefing.png
```
