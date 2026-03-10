# Cinematica Torre — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a first-visit tutorial overlay to rook exercise 1 that highlights the rank+file lanes and shows an inline text banner explaining rook movement.

**Architecture:** On first visit (no localStorage progress), the board renders lane highlights on all cells sharing the rook's rank or file. An inline frosted banner auto-fades after first move or 4 seconds. A `tutorialSeen` flag in localStorage prevents re-showing.

**Tech Stack:** Next.js 14, Tailwind CSS, CSS animations, localStorage

---

### Task 1: Editorial Copy

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts`

**Step 1: Add TUTORIAL_COPY constant**

Add after `BADGE_SHEET_COPY`:

```typescript
export const TUTORIAL_COPY = {
  rook: "The Rook moves in straight lines — horizontal or vertical",
  bishop: "The Bishop moves diagonally — any distance",
  knight: "The Knight jumps in an L-shape — 2+1 squares",
} as const;
```

All 3 pieces included for future use, but only rook is wired now.

**Step 2: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts
git commit -m "feat(tutorial): add TUTORIAL_COPY editorial constants"
```

---

### Task 2: CSS for Lane Highlights and Tutorial Banner

**Files:**
- Modify: `apps/web/src/app/globals.css`

**Step 1: Add `.is-tutorial-hint` cell style**

Add after the `.playhub-board-cell.is-selected` block (around line 343):

```css
.playhub-board-cell.is-tutorial-hint {
  background: rgba(103, 232, 249, 0.10);
  box-shadow: inset 0 0 0 1px rgba(103, 232, 249, 0.15);
}
```

This is a subtle cyan tint — much softer than the amber `is-highlighted` so it doesn't compete with valid-move indicators.

**Step 2: Add `.tutorial-banner` style**

Add after the `.hud-bar` block (around line 493):

```css
.tutorial-banner {
  background: rgba(2, 12, 24, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(103, 232, 249, 0.2);
  border-radius: 12px;
  padding: 8px 16px;
  animation: tutorial-banner-in 400ms ease-out;
}

.tutorial-banner.is-fading {
  animation: tutorial-banner-out 500ms ease-in forwards;
}

@keyframes tutorial-banner-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tutorial-banner-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}
```

**Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style(tutorial): add lane hint and banner CSS"
```

---

### Task 3: Board Component — Accept Tutorial Hints

**Files:**
- Modify: `apps/web/src/components/board.tsx`

**Step 1: Add `tutorialHints` prop to BoardProps**

In the `BoardProps` type (line 50), add:

```typescript
tutorialHints?: Set<string>; // Set of square labels like "a1", "b1" to highlight as tutorial lanes
```

**Step 2: Apply `is-tutorial-hint` class to cells**

In the cell render (line 173, the `className` array), add a check:

```typescript
className={[
  "playhub-board-cell",
  square.isHighlighted ? "is-highlighted" : "",
  square.isSelected ? "is-selected" : "",
  tutorialHints?.has(square.label) ? "is-tutorial-hint" : "",
].join(" ")}
```

The `is-highlighted` and `is-selected` classes take visual precedence (amber) over the subtle cyan `is-tutorial-hint`, so no conflict when both are present.

**Step 3: Commit**

```bash
git add apps/web/src/components/board.tsx
git commit -m "feat(tutorial): board accepts tutorialHints prop for lane highlights"
```

---

### Task 4: Wire Tutorial State in Page + Render Banner in MissionPanel

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx`

**Step 1: Add tutorial state to page.tsx**

Add a helper to compute lane labels (all squares sharing the rook's rank or file):

```typescript
function computeRookLanes(pos: BoardPosition): Set<string> {
  const labels = new Set<string>();
  for (let f = 0; f < 8; f++) {
    labels.add(`${String.fromCharCode(97 + f)}${pos.rank + 1}`);
  }
  for (let r = 0; r < 8; r++) {
    labels.add(`${String.fromCharCode(97 + pos.file)}${r + 1}`);
  }
  // Remove the piece's own square — it already has is-selected styling
  labels.delete(`${String.fromCharCode(97 + pos.file)}${pos.rank + 1}`);
  return labels;
}
```

Add state:

```typescript
const [showTutorial, setShowTutorial] = useState(false);

// On mount: check if rook tutorial was already seen
useEffect(() => {
  if (selectedPiece !== "rook") return;
  const seen = localStorage.getItem("chesscito:tutorial:rook");
  const hasProgress = localStorage.getItem("chesscito:progress:rook");
  if (!seen && !hasProgress) {
    setShowTutorial(true);
  }
}, [selectedPiece]);
```

Add a function to dismiss the tutorial (called on first move):

```typescript
function dismissTutorial() {
  if (!showTutorial) return;
  setShowTutorial(false);
  localStorage.setItem("chesscito:tutorial:rook", "1");
}
```

**Step 2: Compute tutorial hints and pass to Board**

```typescript
const tutorialHints = useMemo(() => {
  if (!showTutorial || selectedPiece !== "rook") return undefined;
  return computeRookLanes(currentExercise.startPos);
}, [showTutorial, selectedPiece, currentExercise.startPos]);
```

Update the Board render to pass `tutorialHints`:

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
/>
```

**Step 3: Dismiss tutorial on first move**

In `handleMove`, add at the very top:

```typescript
dismissTutorial();
```

**Step 4: Add `tutorialBanner` prop to MissionPanel**

In `mission-panel.tsx`, add a new prop:

```typescript
type MissionPanelProps = {
  // ... existing props
  tutorialBanner?: ReactNode;
};
```

Render it at the top of Zone 2 (board stage), before `{board}`:

```tsx
{/* Zone 2: Board Stage — hero, fills all remaining space */}
<div className="min-h-0 flex-1 px-1">
  {tutorialBanner}
  {board}
  {/* Progress bar flush below board */}
  <div className="px-2">{starsBar}</div>
</div>
```

**Step 5: Create TutorialBanner component in page.tsx and pass to MissionPanel**

In `page.tsx`, add a small inline component or render directly:

```tsx
import { TUTORIAL_COPY } from "@/lib/content/editorial";
```

(Already importing from editorial — just add TUTORIAL_COPY to the import.)

Create the banner element:

```tsx
const tutorialBanner = showTutorial ? (
  <TutorialBanner text={TUTORIAL_COPY.rook} />
) : null;
```

Define `TutorialBanner` as a small component in `page.tsx` (or import from a new file — but keeping it inline is simpler since it's tiny):

```tsx
function TutorialBanner({ text }: { text: string }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`tutorial-banner mx-auto mb-1 max-w-[360px] text-center text-xs font-medium text-cyan-100/90 ${fading ? "is-fading" : ""}`}>
      {text}
    </div>
  );
}
```

Note: The banner auto-fades visually after 4s, but the `showTutorial` state (and lane highlights) persist until the first move. This is intentional — the lanes stay visible as guidance even after the text fades.

Pass to MissionPanel:

```tsx
<MissionPanel
  // ... existing props
  tutorialBanner={tutorialBanner}
/>
```

**Step 6: Commit**

```bash
git add apps/web/src/app/play-hub/page.tsx apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "feat(tutorial): wire rook tutorial with lane highlights and inline banner"
```

---

### Task 5: Build Verification

**Step 1: Build**

```bash
pnpm --filter web build
```

Fix any TypeScript or build errors.

**Step 2: Manual test checklist (390px viewport)**

- Fresh visit (clear `chesscito:progress:rook` and `chesscito:tutorial:rook` from localStorage)
- Rook exercise 1 loads → lane highlights visible (cyan tint on rank 1 + file a)
- Text banner appears: "The Rook moves in straight lines — horizontal or vertical"
- Banner auto-fades after ~4 seconds
- On first valid move → lane highlights disappear immediately
- Reload page → tutorial does NOT show again (flag in localStorage)
- Switch to bishop/knight → no tutorial (not wired yet)

**Step 3: Commit any fixes**

```bash
git add -u
git commit -m "fix(tutorial): integration polish"
```
