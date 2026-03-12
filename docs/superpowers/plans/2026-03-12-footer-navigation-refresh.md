# Footer Navigation Refresh — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5-button dock with a 3-layer footer: passive HUD strip, contextual action slot (1 CTA at a time), and persistent 3-button dock.

**Architecture:** The current `OnChainActionsPanel` (5-button bar + QA panel) gets decomposed into three focused components: `ContextualActionSlot` (single CTA based on game state), `PersistentDock` (Badges/Shop/Ranking), and the existing stats bar stays in `MissionPanel`. The `getContextAction()` pure function lives in a shared util and drives which CTA appears. Reset button and its `onReset` prop chain are removed entirely.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Next.js 14 App Router

**Spec:** `docs/superpowers/specs/2026-03-12-footer-navigation-refresh.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `apps/web/src/lib/game/context-action.ts` | `getContextAction()` pure function + `ContextAction` type |
| Create | `apps/web/src/components/play-hub/contextual-action-slot.tsx` | Single CTA button with semantic color variants |
| Create | `apps/web/src/components/play-hub/persistent-dock.tsx` | 3-button navigation bar (Badges, Shop, Ranking) |
| Modify | `apps/web/src/lib/content/editorial.ts` | Rename `resetTrial` → `retry`, add CTA loading labels |
| Modify | `apps/web/src/components/play-hub/mission-panel.tsx` | Restructure Zone 3: HUD strip + action slot + dock |
| Modify | `apps/web/src/app/play-hub/page.tsx` | Wire new components, remove reset button, compute context action |
| Modify | `apps/web/src/app/globals.css` | New footer styles, remove unused dock styles |
| Delete props | `apps/web/src/components/play-hub/onchain-actions-panel.tsx` | Removed entirely (replaced by new components) |

---

## Chunk 1: Core Logic + Editorial

### Task 1: Editorial copy updates

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts`

- [ ] **Step 1: Update CTA_LABELS**

Replace `resetTrial` with `retry` and add loading labels:

```ts
export const CTA_LABELS = {
  startTrial: "Start Trial",
  continue: "Continue",
  claimBadge: GLOSSARY.claimBadge,
  submitScore: GLOSSARY.submitScore,
  retry: "Retry",
  viewLeaderboard: "View Leaderboard",
  backToPlay: "Back to Play",
} as const;

export const FOOTER_CTA_COPY = {
  submitScore: { label: "Submit Score", loading: "Submitting..." },
  useShield: { label: "Use Shield", loading: "Using Shield..." },
  claimBadge: { label: "Claim Badge", loading: "Claiming..." },
  retry: { label: "Retry", loading: null },
  shieldsLeft: (n: number) => `${n} left`,
} as const;
```

- [ ] **Step 2: Search for any references to `resetTrial` in the codebase**

Run: `grep -r "resetTrial" apps/web/src/`

Update any references found to use `retry` instead. Known reference:
- `onchain-actions-panel.tsx:123` — will be deleted in Task 5, no action needed.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts
git commit -m "refactor(editorial): rename resetTrial to retry, add FOOTER_CTA_COPY"
```

---

### Task 2: Context action logic

**Files:**
- Create: `apps/web/src/lib/game/context-action.ts`

- [ ] **Step 1: Create the `getContextAction` pure function**

```ts
export type ContextAction =
  | "submitScore"
  | "useShield"
  | "claimBadge"
  | "retry"
  | null;

export type ContextActionState = {
  phase: "ready" | "success" | "failure";
  shieldsAvailable: number;
  scorePending: boolean;
  badgeClaimable: boolean;
  isConnected: boolean;
  isCorrectChain: boolean;
};

export function getContextAction(state: ContextActionState): ContextAction {
  if (!state.isConnected || !state.isCorrectChain) return null;

  if (state.phase === "failure" && state.shieldsAvailable > 0) return "useShield";
  if (state.phase === "failure") return "retry";

  if (state.scorePending) return "submitScore";
  if (state.badgeClaimable) return "claimBadge";

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/game/context-action.ts
git commit -m "feat(game): add getContextAction pure function"
```

---

### Task 2b: Unit tests for getContextAction

**Files:**
- Create: `apps/web/src/lib/game/__tests__/context-action.test.ts`
- Modify: `apps/web/tsconfig.test.json` (add `context-action.ts` to include)
- Modify: `apps/web/package.json` (add `test:game` to pre-push or run alongside server tests)

- [ ] **Step 1: Update tsconfig.test.json to include context-action**

Add `"src/lib/game/context-action.ts"` to the `include` array:

```json
{
  "include": [
    "src/lib/game/types.ts",
    "src/lib/game/board.ts",
    "src/lib/game/context-action.ts",
    "src/lib/game/rules/**/*.ts",
    "src/lib/game/__tests__/**/*.ts"
  ]
}
```

- [ ] **Step 2: Create the test file**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getContextAction } from "../context-action.js";
import type { ContextActionState } from "../context-action.js";

const BASE: ContextActionState = {
  phase: "ready",
  shieldsAvailable: 0,
  scorePending: false,
  badgeClaimable: false,
  isConnected: true,
  isCorrectChain: true,
};

describe("getContextAction", () => {
  // ── Wallet guards ──────────────────────────────────────
  it("returns null when wallet is disconnected", () => {
    assert.equal(
      getContextAction({ ...BASE, phase: "failure", isConnected: false }),
      null
    );
  });

  it("returns null when on wrong chain", () => {
    assert.equal(
      getContextAction({ ...BASE, phase: "failure", isCorrectChain: false }),
      null
    );
  });

  // ── Normal gameplay ────────────────────────────────────
  it("returns null during normal gameplay (ready phase)", () => {
    assert.equal(getContextAction(BASE), null);
  });

  it("returns null during success phase (auto-advance)", () => {
    assert.equal(
      getContextAction({ ...BASE, phase: "success" }),
      null
    );
  });

  // ── Failure states ─────────────────────────────────────
  it("returns useShield on failure with shields available", () => {
    assert.equal(
      getContextAction({ ...BASE, phase: "failure", shieldsAvailable: 3 }),
      "useShield"
    );
  });

  it("returns retry on failure with no shields", () => {
    assert.equal(
      getContextAction({ ...BASE, phase: "failure", shieldsAvailable: 0 }),
      "retry"
    );
  });

  // ── Progression states ─────────────────────────────────
  it("returns submitScore when score is pending", () => {
    assert.equal(
      getContextAction({ ...BASE, scorePending: true }),
      "submitScore"
    );
  });

  it("returns claimBadge when badge is claimable", () => {
    assert.equal(
      getContextAction({ ...BASE, badgeClaimable: true }),
      "claimBadge"
    );
  });

  // ── Priority: scorePending > badgeClaimable ────────────
  it("prioritizes submitScore over claimBadge", () => {
    assert.equal(
      getContextAction({ ...BASE, scorePending: true, badgeClaimable: true }),
      "submitScore"
    );
  });

  // ── Priority: failure > scorePending ───────────────────
  it("prioritizes useShield over scorePending on failure", () => {
    assert.equal(
      getContextAction({
        ...BASE,
        phase: "failure",
        shieldsAvailable: 2,
        scorePending: true,
      }),
      "useShield"
    );
  });

  it("prioritizes retry over badgeClaimable on failure without shields", () => {
    assert.equal(
      getContextAction({
        ...BASE,
        phase: "failure",
        shieldsAvailable: 0,
        badgeClaimable: true,
      }),
      "retry"
    );
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
cd apps/web && npm run test:game
```

Expected: All 11 tests pass.

- [ ] **Step 4: Update package.json test script to include context-action test**

Update `test:game` in `package.json` to also run the context-action test:

```json
"test:game": "rm -rf .tmp/game-tests .tmp/tsconfig.test.tsbuildinfo && tsc -p tsconfig.test.json && node --test .tmp/game-tests/lib/game/__tests__/context-action.test.js && rm -rf .tmp/game-tests .tmp/tsconfig.test.tsbuildinfo"
```

And add `test:game` to the main `test` script:

```json
"test": "npm run test:server && npm run test:game"
```

- [ ] **Step 5: Run full test suite**

```bash
cd apps/web && npm test
```

Expected: server tests (31) + game tests (11) all pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/game/__tests__/context-action.test.ts apps/web/tsconfig.test.json apps/web/package.json
git commit -m "test(game): add getContextAction unit tests (11 cases)"
```

---

## Chunk 2: New Components

### Task 3: ContextualActionSlot component

**Files:**
- Create: `apps/web/src/components/play-hub/contextual-action-slot.tsx`

- [ ] **Step 1: Create the component**

This renders a single full-width CTA button that changes color/label based on the current `ContextAction`. It collapses (height 0) when action is `null`.

```tsx
"use client";

import type { ContextAction } from "@/lib/game/context-action";
import { FOOTER_CTA_COPY } from "@/lib/content/editorial";

type ContextualActionSlotProps = {
  action: ContextAction;
  shieldsAvailable: number;
  isBusy: boolean;
  onSubmitScore: () => void;
  onUseShield: () => void;
  onClaimBadge: () => void;
  onRetry: () => void;
};

const ACTION_STYLES: Record<
  Exclude<ContextAction, null>,
  { bg: string; glow: string; text: string }
> = {
  submitScore: {
    bg: "bg-gradient-to-b from-[#23C8F3] to-[#16A9E0]",
    glow: "shadow-[0_0_20px_rgba(35,200,243,0.24)]",
    text: "text-white",
  },
  useShield: {
    bg: "bg-gradient-to-b from-[#F6A400] to-[#EE8B00]",
    glow: "shadow-[0_0_20px_rgba(246,164,0,0.22)]",
    text: "text-[#FFF8ED]",
  },
  claimBadge: {
    bg: "bg-gradient-to-b from-[#9B59FF] to-[#7B3FF2]",
    glow: "shadow-[0_0_20px_rgba(155,89,255,0.22)]",
    text: "text-white",
  },
  retry: {
    bg: "bg-[rgba(148,170,210,0.14)]",
    glow: "",
    text: "text-[rgba(234,242,255,0.82)]",
  },
};

function getHandler(
  action: Exclude<ContextAction, null>,
  props: ContextualActionSlotProps
): () => void {
  switch (action) {
    case "submitScore": return props.onSubmitScore;
    case "useShield": return props.onUseShield;
    case "claimBadge": return props.onClaimBadge;
    case "retry": return props.onRetry;
  }
}

export function ContextualActionSlot(props: ContextualActionSlotProps) {
  const { action, shieldsAvailable, isBusy } = props;

  if (!action) return null;

  const copy = FOOTER_CTA_COPY[action];
  const style = ACTION_STYLES[action];
  const handler = getHandler(action, props);
  const label = isBusy && copy.loading ? copy.loading : copy.label;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 px-5 py-2 duration-200">
      <button
        type="button"
        onClick={handler}
        disabled={isBusy}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold uppercase tracking-wide transition-transform active:scale-[0.98] disabled:opacity-70 ${style.bg} ${style.glow} ${style.text} ${action === "retry" ? "border border-[rgba(190,210,255,0.08)]" : ""}`}
      >
        {isBusy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        <span>{label}</span>
        {action === "useShield" && !isBusy ? (
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
            {FOOTER_CTA_COPY.shieldsLeft(shieldsAvailable)}
          </span>
        ) : null}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/play-hub/contextual-action-slot.tsx
git commit -m "feat(play-hub): add ContextualActionSlot component"
```

---

### Task 4: PersistentDock component

**Files:**
- Create: `apps/web/src/components/play-hub/persistent-dock.tsx`

- [ ] **Step 1: Create the component**

3-button navigation bar with consistent icon sizing. Receives the same `badgeControl`, `shopControl`, `leaderboardControl` ReactNodes that `OnChainActionsPanel` used.

```tsx
import type { ReactNode } from "react";

type PersistentDockProps = {
  badgeControl: ReactNode;
  shopControl: ReactNode;
  leaderboardControl: ReactNode;
};

export function PersistentDock({
  badgeControl,
  shopControl,
  leaderboardControl,
}: PersistentDockProps) {
  return (
    <div className="flex items-center justify-around px-8 pb-[calc(4px+env(safe-area-inset-bottom))] pt-2">
      {badgeControl}
      {shopControl}
      {leaderboardControl}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/play-hub/persistent-dock.tsx
git commit -m "feat(play-hub): add PersistentDock component"
```

---

## Chunk 3: Integration

### Task 5: Refactor MissionPanel Zone 3

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx`

- [ ] **Step 1: Update MissionPanel props**

Replace `actionPanel: ReactNode` with the new footer components:

```ts
// Old prop:
// actionPanel: ReactNode;

// New props:
contextualAction: ReactNode;
persistentDock: ReactNode;
```

Remove `shieldCount` and `onUseShield` from MissionPanel props — shields are now handled by `ContextualActionSlot` in the footer, not by `PhaseFlash`. **Note:** Keep `PhaseFlash` `onUseShield` for now — the shield button in the failure overlay is a separate interaction from the footer CTA. We can consolidate later if needed.

Actually, re-reading the spec: "Use Shield" in the footer replaces the PhaseFlash shield button. Let me reconsider...

The spec says the contextual action slot shows "Use Shield" when `phase === "failure" && shieldsAvailable > 0`. The current PhaseFlash already shows a shield button in this state. To avoid duplicate CTAs:

**Decision:** Remove the shield button from PhaseFlash. The footer `Use Shield` CTA is now the only way to use a shield on failure. PhaseFlash becomes purely visual feedback (success/failure flash) with no buttons.

- [ ] **Step 2: Restructure Zone 3 (dock area)**

Replace the current Zone 3 content:

**Before (current):**
```tsx
{/* Zone 3 — Dock */}
<div className="chesscito-dock">
  <div className="chesscito-stats-bar">
    {/* SCORE / TIME / TARGET */}
  </div>
  {actionPanel}
</div>
```

**After (new 3-layer footer):**
```tsx
{/* Zone 3 — Footer */}
<div className="chesscito-footer">
  {/* Layer 1: HUD strip */}
  <div className="chesscito-hud-strip">
    <div className="chesscito-hud-item">
      <span className="chesscito-hud-label">SCORE</span>
      <span className="chesscito-hud-value">{score}</span>
    </div>
    <div className="chesscito-hud-divider" />
    <div className="chesscito-hud-item">
      <span className="chesscito-hud-label">TIME</span>
      <span className="chesscito-hud-value">{timeDisplay}</span>
    </div>
    <div className="chesscito-hud-divider" />
    <div className="chesscito-hud-item">
      <span className="chesscito-hud-label">TARGET</span>
      <span className="chesscito-hud-value chesscito-hud-target">{targetLabel}</span>
    </div>
  </div>

  {/* Layer 2: Contextual action slot */}
  {contextualAction}

  {/* Layer 3: Persistent dock */}
  {persistentDock}
</div>
```

- [ ] **Step 3: Remove shield button from PhaseFlash**

In the `PhaseFlash` component inside `mission-panel.tsx`, remove the shield button JSX and the `shieldCount` / `onUseShield` props. PhaseFlash becomes a simple success/failure flash overlay.

Remove from PhaseFlash:
- `shieldCount?: number` prop
- `onUseShield?: () => void` prop
- The shield button render block (lines ~93-104 in current code)
- The extended timing logic for shield variant

Keep:
- Success/failure text display
- Auto-fade animation
- `onHidden` callback

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "refactor(play-hub): restructure MissionPanel footer to 3-layer architecture"
```

---

### Task 6: Wire everything in page.tsx

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`

- [ ] **Step 1: Add imports**

```ts
import { getContextAction } from "@/lib/game/context-action";
import { ContextualActionSlot } from "@/components/play-hub/contextual-action-slot";
import { PersistentDock } from "@/components/play-hub/persistent-dock";
```

Remove:
```ts
import { OnChainActionsPanel } from "@/components/play-hub/onchain-actions-panel";
```

- [ ] **Step 2: Compute context action**

Add after existing derived values (around line ~355):

```ts
const contextAction = getContextAction({
  phase,
  shieldsAvailable: shieldCount,
  scorePending: canSendOnChain,
  badgeClaimable: badgeEarned && !hasClaimedBadge,
  isConnected,
  isCorrectChain,
});
```

- [ ] **Step 3: Create a `handleRetry` function**

```ts
function handleRetry() {
  resetBoard();
}
```

This replaces the old `onReset` prop. The `resetBoard` function stays — it's used internally for auto-advance and piece switching. Only the **user-facing button** is removed.

- [ ] **Step 4: Update MissionPanel props**

Replace the `actionPanel` prop with the new components:

```tsx
<MissionPanel
  // ... existing props (selectedPiece, phase, board, etc.) ...
  // Remove: shieldCount, onUseShield (PhaseFlash no longer has shield button)
  contextualAction={
    <ContextualActionSlot
      action={contextAction}
      shieldsAvailable={shieldCount}
      isBusy={isWriting || isSubmitConfirming || isClaimConfirming}
      onSubmitScore={() => void handleSubmitScore()}
      onUseShield={handleUseShield}
      onClaimBadge={() => void handleClaimBadge()}
      onRetry={handleRetry}
    />
  }
  persistentDock={
    <PersistentDock
      badgeControl={<BadgeSheet ... />}
      shopControl={<ShopSheet ... />}
      leaderboardControl={<LeaderboardSheet ... />}
    />
  }
/>
```

Move `BadgeSheet`, `ShopSheet`, and `LeaderboardSheet` from inside the old `OnChainActionsPanel` wrapper to `PersistentDock` props. Their props stay the same.

- [ ] **Step 5: Remove OnChainActionsPanel wrapper div**

Delete the `<div className="space-y-3">` wrapper that contained `OnChainActionsPanel` and `StatusStrip`. Move `StatusStrip` (QA only) somewhere appropriate — either above the footer or inside a conditional debug section.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/play-hub/page.tsx
git commit -m "feat(play-hub): wire 3-layer footer with contextual action slot"
```

---

### Task 7: Update CSS

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Add new footer CSS classes**

```css
/* ── Footer (3-layer) ──────────────────────────────────── */
.chesscito-footer {
  background: linear-gradient(180deg, #061126 0%, #0a1630 100%);
  border-top: 1px solid rgba(110, 160, 255, 0.08);
  border-radius: 20px 20px 0 0;
}

.chesscito-hud-strip {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12px 20px;
}

.chesscito-hud-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.chesscito-hud-label {
  font-size: 0.65rem;
  line-height: 1;
  letter-spacing: 0.15em;
  color: rgba(210, 225, 255, 0.55);
  font-weight: 600;
  text-transform: uppercase;
}

.chesscito-hud-value {
  font-size: 1.25rem;
  line-height: 1;
  font-weight: 700;
  color: #eaf2ff;
  font-variant-numeric: tabular-nums;
}

.chesscito-hud-target {
  color: #20e0d8;
}

.chesscito-hud-divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 2: Keep or adapt `.chesscito-dock` for the persistent dock area**

The old `.chesscito-dock` had the glass background + safe-area padding. Now `.chesscito-footer` handles the background. The dock area inside just needs spacing. We can remove the old `.chesscito-dock` class entirely since `.chesscito-footer` replaces it.

Remove these classes that are no longer used:
- `.chesscito-stats-bar`
- `.chesscito-stats-item`
- `.chesscito-stats-label`
- `.chesscito-stats-value`

Keep `.chesscito-dock` class definition but simplify it to just handle dock-specific concerns, or remove it if `PersistentDock` uses Tailwind inline.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style(play-hub): add 3-layer footer CSS, remove old dock styles"
```

---

### Task 8: Delete OnChainActionsPanel

**Files:**
- Delete: `apps/web/src/components/play-hub/onchain-actions-panel.tsx`

- [ ] **Step 1: Verify no remaining imports**

Run: `grep -r "onchain-actions-panel\|OnChainActionsPanel" apps/web/src/`

Should return zero results after Task 6.

- [ ] **Step 2: Delete the file**

```bash
rm apps/web/src/components/play-hub/onchain-actions-panel.tsx
```

- [ ] **Step 3: Verify the app builds**

```bash
cd apps/web && npx next build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/components/play-hub/onchain-actions-panel.tsx
git commit -m "chore(play-hub): remove OnChainActionsPanel (replaced by 3-layer footer)"
```

---

## Chunk 4: QA Panel Handling

### Task 9: Relocate QA panel

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`

The QA panel (level ID override input + StatusStrip) currently lived inside the `OnChainActionsPanel` wrapper. It needs a new home.

- [ ] **Step 1: Move QA controls**

The QA mode section (level ID override) can be rendered conditionally above the footer or inside MissionPanel's board area, gated by `qaEnabled`. Since QA mode is only for development/testing (shown when `!isMiniPay`), it can render as a floating debug panel:

```tsx
{qaEnabled && !isMiniPay ? (
  <details className="absolute bottom-[200px] left-2 right-2 z-30 mission-soft rune-frame rounded-xl px-3 py-2 text-xs text-slate-200">
    <summary className="cursor-pointer list-none font-semibold uppercase tracking-[0.2em] text-cyan-300">
      QA mode
    </summary>
    <div className="mt-2 space-y-2">
      <label className="block">
        Level ID override
        <input
          type="number"
          min={1}
          max={9999}
          step={1}
          value={qaLevelInput}
          onChange={(event) => setQaLevelInput(event.target.value)}
          className="mt-1 w-full rounded-lg border border-cyan-600/45 bg-slate-900/90 px-3 py-2 text-sm text-cyan-50"
        />
      </label>
      <StatusStrip ... />
    </div>
  </details>
) : null}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/play-hub/page.tsx
git commit -m "refactor(play-hub): relocate QA panel to floating debug overlay"
```

---

## Chunk 5: Visual Polish

### Task 10: Visual QA and responsive testing

- [ ] **Step 1: Test in 390px viewport**

Open browser dev tools, set viewport to 390px width. Verify:
- HUD strip shows 3 values with dividers, readable
- Contextual CTA appears/disappears smoothly
- Dock shows 3 icons evenly spaced
- Footer is more compact than before
- Board remains the primary focus

- [ ] **Step 2: Test all CTA states**

Play through each scenario:
1. Normal gameplay → no CTA visible
2. Fail an exercise (no shields) → "Retry" appears (slate)
3. Buy shields in shop, fail → "Use Shield" appears (amber)
4. Complete all 5 exercises → "Submit Score" appears (cyan)
5. After submitting, if badge unclaimed → "Claim Badge" appears (purple)

- [ ] **Step 3: Verify PhaseFlash**

- Success flash still shows green text, auto-fades
- Failure flash still shows red text, auto-fades
- No shield button in PhaseFlash anymore
- Shield usage is via footer CTA only

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "style(play-hub): footer navigation refresh visual polish"
```
