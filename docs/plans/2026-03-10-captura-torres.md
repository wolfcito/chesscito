# Captura con Torres — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add capture-style exercises to rook exercises 4-5, with a warm-tinted target indicator and "CAPTURE" stats label.

**Architecture:** Add `isCapture?: boolean` to Exercise type. Mark rook exercises 4-5. Board renders a different CSS class for capture targets. MissionPanel shows "CAPTURE" in the stats bar. Tutorial banner appears on first capture exercise.

**Tech Stack:** Next.js 14, Tailwind CSS, TypeScript

---

### Task 1: Data Model + Exercise Data

**Files:**
- Modify: `apps/web/src/lib/game/types.ts`
- Modify: `apps/web/src/lib/game/exercises.ts`
- Modify: `apps/web/src/lib/content/editorial.ts`

**Step 1: Add `isCapture` to Exercise type**

In `apps/web/src/lib/game/types.ts`, the Exercise type is:

```typescript
export type Exercise = {
  id: string;
  startPos: BoardPosition;
  targetPos: BoardPosition;
  optimalMoves: number;
};
```

Add the optional field:

```typescript
export type Exercise = {
  id: string;
  startPos: BoardPosition;
  targetPos: BoardPosition;
  optimalMoves: number;
  isCapture?: boolean;
};
```

**Step 2: Mark rook exercises 4-5 as captures**

In `apps/web/src/lib/game/exercises.ts`, the current rook exercises 4-5 are:

```typescript
// 4. Distinta fila Y distinta columna — necesita 2 movimientos
{ id: "rook-4", startPos: pos(0, 0), targetPos: pos(7, 7), optimalMoves: 2 },
// 5. Esquina a posición compleja
{ id: "rook-5", startPos: pos(7, 7), targetPos: pos(1, 2), optimalMoves: 2 },
```

Change to:

```typescript
// 4. Captura — esquina a esquina diagonal
{ id: "rook-4", startPos: pos(0, 0), targetPos: pos(7, 7), optimalMoves: 2, isCapture: true },
// 5. Captura — esquina a posición compleja
{ id: "rook-5", startPos: pos(7, 7), targetPos: pos(1, 2), optimalMoves: 2, isCapture: true },
```

**Step 3: Add capture editorial copy**

In `apps/web/src/lib/content/editorial.ts`, add after `TUTORIAL_COPY`:

```typescript
export const CAPTURE_COPY = {
  statsLabel: "CAPTURE",
  tutorialBanner: "Capture the target — move your Rook to its square",
} as const;
```

**Step 4: Commit**

```bash
git add apps/web/src/lib/game/types.ts apps/web/src/lib/game/exercises.ts apps/web/src/lib/content/editorial.ts
git commit -m "feat(capture): add isCapture flag to Exercise type and mark rook 4-5"
```

---

### Task 2: Capture Target CSS

**Files:**
- Modify: `apps/web/src/app/globals.css`

**Step 1: Add `.playhub-board-target-capture` style**

Add immediately after the `.playhub-board-target` block and its `@keyframes chesscito-target-pulse` (around line 396). This goes inside `@layer components`:

```css
  .playhub-board-target-capture {
    position: absolute;
    left: 50%;
    top: 46%;
    width: clamp(32px, 11.5vw, 52px);
    height: clamp(32px, 11.5vw, 52px);
    transform: translate(-50%, -50%) scaleY(0.52);
    background-image: image-set(
      url("/art/target-circle.avif") type("image/avif"),
      url("/art/target-circle.webp") type("image/webp"),
      url("/art/target-circle.png") type("image/png")
    );
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    animation: chesscito-target-pulse 2s ease-in-out infinite;
    pointer-events: none;
    filter: hue-rotate(160deg) saturate(1.8) brightness(1.1);
  }
```

The `filter: hue-rotate(160deg) saturate(1.8) brightness(1.1)` shifts the cyan target circle to a warm red/amber tone. The rest of the properties are identical to `.playhub-board-target`.

**Step 2: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style(capture): add warm-tinted capture target indicator"
```

---

### Task 3: Board Component — Render Capture Target

**Files:**
- Modify: `apps/web/src/components/board.tsx`

**Step 1: Add `isCapture` prop to BoardProps**

The current type (around line 50):

```typescript
type BoardProps = {
  pieceType?: PieceId;
  startPosition?: BoardPosition;
  mode?: "tutorial" | "practice";
  targetPosition?: BoardPosition | null;
  isLocked?: boolean;
  onMove?: (position: BoardPosition, movesCount: number) => void;
  tutorialHints?: Set<string>;
};
```

Add:

```typescript
  isCapture?: boolean;
```

Destructure it in the component with default `false`.

**Step 2: Use capture class for target indicator**

In the cell render, there's currently (around line 181):

```tsx
{square.isTarget && !square.piece ? (
  <span className="playhub-board-target" />
) : null}
```

Change to:

```tsx
{square.isTarget && !square.piece ? (
  <span className={isCapture ? "playhub-board-target-capture" : "playhub-board-target"} />
) : null}
```

**Step 3: Commit**

```bash
git add apps/web/src/components/board.tsx
git commit -m "feat(capture): board renders warm target indicator for capture exercises"
```

---

### Task 4: Wire isCapture Through Page + Stats Label

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx`

**Step 1: Import CAPTURE_COPY in page.tsx**

Add `CAPTURE_COPY` to the existing editorial import (line 36):

```typescript
import { CAPTURE_COPY, CTA_LABELS, PIECE_LABELS, TUTORIAL_COPY } from "@/lib/content/editorial";
```

**Step 2: Pass isCapture to Board**

The Board is rendered around line 680. Add `isCapture`:

```tsx
<Board
  key={boardKey}
  pieceType={selectedPiece}
  startPosition={currentExercise.startPos}
  mode="practice"
  targetPosition={currentExercise.targetPos}
  isLocked={phase === "failure" || phase === "success"}
  onMove={handleMove}
  tutorialHints={tutorialHints}
  isCapture={currentExercise.isCapture}
/>
```

**Step 3: Add `targetLabel` prop to MissionPanel**

In `apps/web/src/components/play-hub/mission-panel.tsx`, the stats bar currently hardcodes "h1" as the target:

```tsx
<div className="chesscito-stats-item">
  <span className="chesscito-stats-label">TARGET</span>
  <span className="chesscito-stats-value">h1</span>
</div>
```

Add a `targetLabel: string` prop to `MissionPanelProps`:

```typescript
type MissionPanelProps = {
  // ... existing props
  targetLabel: string;
};
```

Destructure it and use it:

```tsx
<span className="chesscito-stats-value">{targetLabel}</span>
```

**Step 4: Compute targetLabel in page.tsx and pass to MissionPanel**

In page.tsx, before the return:

```typescript
const targetLabel = currentExercise.isCapture
  ? CAPTURE_COPY.statsLabel
  : `${String.fromCharCode(97 + currentExercise.targetPos.file)}${currentExercise.targetPos.rank + 1}`;
```

Pass to MissionPanel:

```tsx
<MissionPanel
  // ... existing props
  targetLabel={targetLabel}
/>
```

**Step 5: Show capture tutorial banner on first capture exercise**

The existing tutorial system shows a banner for first-visit rook users. For capture, we want a banner when the user first encounters a capture exercise.

In page.tsx, update the tutorialBanner logic. Currently:

```tsx
const tutorialBanner = showTutorial ? (
  <TutorialBanner text={TUTORIAL_COPY[selectedPiece]} />
) : null;
```

Extend to also show the capture banner:

```tsx
const [captureHintSeen, setCaptureHintSeen] = useState(false);

const showCaptureHint = Boolean(currentExercise.isCapture) && !captureHintSeen && phase === "ready";
```

Add a useEffect to detect first capture exercise:

```typescript
useEffect(() => {
  setCaptureHintSeen(false);
}, [selectedPiece]);
```

Update the banner:

```tsx
const tutorialBanner = showTutorial ? (
  <TutorialBanner text={TUTORIAL_COPY[selectedPiece]} />
) : showCaptureHint ? (
  <TutorialBanner text={CAPTURE_COPY.tutorialBanner} />
) : null;
```

And dismiss it on first move — in `handleMove`, after `dismissTutorial()`:

```typescript
if (!captureHintSeen && currentExercise.isCapture) {
  setCaptureHintSeen(true);
}
```

**Step 6: Commit**

```bash
git add apps/web/src/app/play-hub/page.tsx apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "feat(capture): wire isCapture through page, stats label, and capture banner"
```

---

### Task 5: Build Verification

**Step 1: Build**

```bash
pnpm --filter web build
```

Fix any TypeScript or build errors.

**Step 2: Manual test checklist (390px viewport)**

- Rook exercises 1-3: normal cyan target, stats show target square label (e.g. "h1")
- Rook exercise 4: warm red/amber target indicator, stats show "CAPTURE"
- Rook exercise 5: same warm target + "CAPTURE" label
- First time entering exercise 4: capture tutorial banner appears
- Banner dismisses on first move
- Banner doesn't reappear on exercise 5 (already seen)
- Scoring still works (3★ for optimal moves)
- Badge threshold unchanged (10/15 stars)
- Bishop/knight exercises unaffected

**Step 3: Commit any fixes**

```bash
git add -u
git commit -m "fix(capture): integration polish"
```
