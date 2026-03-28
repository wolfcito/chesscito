# App Shell Cohesion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the Chesscito play shell into a single coherent game surface using shared tokens, a new GameplayPanel component, and proportional spacing — without changing colors, icons, or Background Pack logic.

**Architecture:** 6-phase refactor of `mission-panel.tsx` and `globals.css`. Phase 1 defines CSS custom properties (shell tokens). Phase 2 creates `<GameplayPanel>` with 3 composable slots. Phases 3-4 migrate mission card, stats, and CTA into GameplayPanel. Phase 5 anchors the header rail. Phase 6 unifies spacing and dock alignment. Each phase is one commit.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, CSS custom properties

**Spec:** `docs/superpowers/specs/2026-03-28-app-shell-cohesion-design.md`

---

### Task 1: Define shell token system

**Files:**
- Modify: `apps/web/src/app/globals.css:29-47` (`:root` custom properties block)

- [ ] **Step 1: Add shell tokens to `:root`**

In `apps/web/src/app/globals.css`, add these tokens after line 47 (`--header-zone-border`), before the Asset Treatment System comment:

```css
    /* ── Shell Cohesion — layout tokens ── */
    --shell-radius: 16px;
    --shell-border: rgba(255, 255, 255, 0.06);
    --shell-divider: rgba(255, 255, 255, 0.04);
    --shell-gap-xs: 4px;
    --shell-gap-sm: 8px;
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds with no errors. No intentional visual change — tokens defined but not consumed yet.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style: define shell cohesion layout tokens (radius, border, divider, gaps)

Wolfcito 🐾 @akawolfcito"
```

---

### Task 2: Create GameplayPanel component

**Files:**
- Create: `apps/web/src/components/play-hub/gameplay-panel.tsx`

- [ ] **Step 1: Create the GameplayPanel component**

Create `apps/web/src/components/play-hub/gameplay-panel.tsx`:

```tsx
import type { ReactNode } from "react";

type GameplayPanelProps = {
  mission?: ReactNode;
  stats?: ReactNode;
  action?: ReactNode;
};

export function GameplayPanel({ mission, stats, action }: GameplayPanelProps) {
  const hasAnySlot = mission || stats || action;
  if (!hasAnySlot) return null;

  return (
    <div
      className="mx-2 overflow-hidden"
      style={{
        borderRadius: "var(--shell-radius)",
        border: "1px solid var(--shell-border)",
        background: "var(--surface-c-light)",
      }}
    >
      {mission && (
        <div className="px-4 py-2.5">{mission}</div>
      )}
      {mission && stats && (
        <div
          className="h-px"
          style={{ background: "var(--shell-divider)" }}
        />
      )}
      {stats && (
        <div className="px-3 py-1.5">{stats}</div>
      )}
      {(mission || stats) && action && (
        <div
          className="h-px"
          style={{ background: "var(--shell-divider)" }}
        />
      )}
      {action && (
        <div className="px-3 pb-1.5 pt-1">{action}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds. Component is created but not yet rendered — no visual change.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/play-hub/gameplay-panel.tsx
git commit -m "feat: create GameplayPanel component with mission/stats/action slots

Wolfcito 🐾 @akawolfcito"
```

---

### Task 3: Move mission card into GameplayPanel

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx:95-257`

This task moves the mission card markup out of Zone B (between board and footer) and into the GameplayPanel's mission slot. The mission card loses its standalone container styling — GameplayPanel now provides containment.

- [ ] **Step 1: Add GameplayPanel import**

At the top of `mission-panel.tsx`, add the import after the existing imports (line 7):

```tsx
import { GameplayPanel } from "@/components/play-hub/gameplay-panel";
```

- [ ] **Step 2: Extract mission content into a variable**

Inside the `MissionPanel` component function body (before the `return`), extract the mission card content — just the inner content, without the standalone container wrapper. Add this after the `useEffect` block (after line 121):

```tsx
  const missionContent = (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-400/70">
          {MISSION_BRIEFING_COPY.label}
        </p>
        <p key={targetLabel} className="mission-typewriter text-sm font-bold text-slate-100">
          {isCapture
            ? <>Move your {PIECE_LABELS[selectedPiece as keyof typeof PIECE_LABELS]} to <span className="text-rose-400">CAPTURE</span></>
            : `Move your ${PIECE_LABELS[selectedPiece as keyof typeof PIECE_LABELS]} to ${targetLabel}`}
        </p>
        <p key={`hint-${targetLabel}`} className="mission-typewriter text-[11px] text-cyan-100/40" style={{ animationDelay: "1s" }}>
          {MISSION_BRIEFING_COPY.moveHint[selectedPiece as keyof typeof MISSION_BRIEFING_COPY.moveHint]}
        </p>
      </div>
      <picture className="h-12 w-12 shrink-0">
        <source srcSet="/art/favicon-wolf.webp" type="image/webp" />
        <img src="/art/favicon-wolf.png" alt="" aria-hidden="true" className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(103,232,249,0.3)]" />
      </picture>
    </div>
  );
```

- [ ] **Step 3: Remove the old mission card and gradient divider from the JSX**

Remove lines 197–219 (the mission card `<div className="mx-2 mt-1 ...">` and the gradient divider `<div className="h-px bg-gradient-to-r ...">`). These two blocks sit between the Zone B closing `</div>` and the Zone C comment.

Delete this entire block from the JSX:

```tsx
      {/* Mission card — persistent objective with wolf mascot */}
      <div className="mx-2 mt-1 flex items-center gap-3 rounded-2xl border border-white/[0.06] px-4 py-2.5" style={{ background: "linear-gradient(180deg, rgba(12,20,35,0.60) 0%, rgba(6,14,28,0.50) 100%)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.04), inset 0 -1px 2px rgba(0,0,0,0.2)" }}>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-400/70">
            {MISSION_BRIEFING_COPY.label}
          </p>
          <p key={targetLabel} className="mission-typewriter text-sm font-bold text-slate-100">
            {isCapture
              ? <>Move your {PIECE_LABELS[selectedPiece as keyof typeof PIECE_LABELS]} to <span className="text-rose-400">CAPTURE</span></>
              : `Move your ${PIECE_LABELS[selectedPiece as keyof typeof PIECE_LABELS]} to ${targetLabel}`}
          </p>
          <p key={`hint-${targetLabel}`} className="mission-typewriter text-[11px] text-cyan-100/40" style={{ animationDelay: "1s" }}>
            {MISSION_BRIEFING_COPY.moveHint[selectedPiece as keyof typeof MISSION_BRIEFING_COPY.moveHint]}
          </p>
        </div>
        <picture className="h-12 w-12 shrink-0">
          <source srcSet="/art/favicon-wolf.webp" type="image/webp" />
          <img src="/art/favicon-wolf.png" alt="" aria-hidden="true" className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(103,232,249,0.3)]" />
        </picture>
      </div>

      {/* Visual transition between board and footer */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />
```

- [ ] **Step 4: Insert GameplayPanel before Zone C footer**

Replace the deleted block with the GameplayPanel. Place it between the board zone closing `</div>` and the Zone C footer `<div className="chesscito-footer ...">`:

```tsx
      {/* GameplayPanel — mission + stats + action */}
      <GameplayPanel mission={missionContent} />
```

Note: only the `mission` slot is populated in this task. Stats and action come in Task 4.

- [ ] **Step 5: Verify build and visual regression**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds.

Open in browser at mobile viewport (390px). Verify:
- Mission text still renders with typewriter animation
- Wolf mascot icon still visible at 48x48
- Mission label ("OBJECTIVE") still shows above the instruction text
- Piece hint text still shows below with 1s delay
- Mission card now sits inside GameplayPanel's rounded container instead of its old standalone styled div

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "refactor: move mission card into GameplayPanel mission slot

Wolfcito 🐾 @akawolfcito"
```

---

### Task 4: Consolidate stats + CTA into GameplayPanel

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx`

This task moves the stats row and CTA from Zone C footer into GameplayPanel's `stats` and `action` slots. The `chesscito-footer` wrapper then only contains the dock.

- [ ] **Step 1: Extract stats content into a variable**

Add this variable in the `MissionPanel` function body, after `missionContent`:

```tsx
  const statsContent = (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{exerciseDrawer}</div>
      <span className="h-4 w-px bg-white/8" />
      <div className="flex flex-1 items-center justify-center gap-4">
        <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-white/75">
          <Star size={14} className="opacity-65" />
          {score}
        </span>
        <span className="text-xs text-white/15">&middot;</span>
        <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-white/75">
          <Timer size={14} className="opacity-65" />
          {Number(timeMs) / 1000}s
        </span>
      </div>
    </div>
  );
```

- [ ] **Step 2: Update GameplayPanel to pass all three slots**

Replace the current GameplayPanel line:

```tsx
      <GameplayPanel mission={missionContent} />
```

with:

```tsx
      <GameplayPanel
        mission={missionContent}
        stats={statsContent}
        action={contextualAction}
      />
```

- [ ] **Step 3: Strip Zone C footer down to just the dock**

Replace the entire Zone C footer block:

```tsx
      {/* Zone C: Footer — micro-stats + CTA merged, then dock */}
      <div className="chesscito-footer shrink-0">
        {/* Layer 1: Interactive progress chip + passive stats */}
        <div
          className="mx-2 flex items-center gap-3 rounded-xl border border-white/[0.06] py-1.5 px-3"
          style={{ background: "linear-gradient(180deg, rgba(12,20,35,0.55) 0%, rgba(6,14,28,0.45) 100%)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.04), inset 0 -1px 2px rgba(0,0,0,0.2)" }}
        >
          {/* Interactive chip — exercise drawer trigger */}
          <div className="shrink-0">{exerciseDrawer}</div>
          {/* Separator */}
          <span className="h-4 w-px bg-white/8" />
          {/* Passive stats */}
          <div className="flex flex-1 items-center justify-center gap-4">
            <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-white/75">
              <Star size={14} className="opacity-65" />
              {score}
            </span>
            <span className="text-xs text-white/15">&middot;</span>
            <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-white/75">
              <Timer size={14} className="opacity-65" />
              {Number(timeMs) / 1000}s
            </span>
          </div>
        </div>
        <div className="px-3 pb-1.5">
          {contextualAction}
        </div>

        {/* Layer 2: Dock (navigation) */}
        {persistentDock}
      </div>
```

with:

```tsx
      {/* Dock — persistent navigation, separate from GameplayPanel */}
      <div className="shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {persistentDock}
      </div>
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 5: Visual regression check — all CTA states**

Open in browser at mobile viewport (390px). Verify each CTA state works:
- Default (no action): Arena link shows with Swords icon
- `submitScore`: cyan gradient button
- `retry`: muted button with RotateCcw icon
- `useShield`: amber button with shield count badge
- `claimBadge`: purple gradient button
- `connectWallet`: cyan gradient with Wallet icon
- `switchNetwork`: amber gradient with ArrowLeftRight icon

Also verify slot collapse: when `action` is the Arena link (default state), no empty divider rows appear.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "refactor: consolidate stats + CTA into GameplayPanel slots

Wolfcito 🐾 @akawolfcito"
```

---

### Task 5: Anchor the header rail

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx` (Zone A markup)
- Modify: `apps/web/src/app/globals.css` (add `.shell-header-rail` class)

- [ ] **Step 1: Add header rail CSS class in globals.css**

Add after the hero-rail-tab styles (after line 855 — after `.hero-rail-tab.is-inactive:active` block), before the Asset Treatment System comment:

```css
/* ── Shell header rail — anchoring treatment ── */
.shell-header-rail {
  padding-left: 8px;
  padding-right: 8px;
  padding-top: max(env(safe-area-inset-top), 12px);
  margin-bottom: var(--shell-gap-xs);
}

.shell-header-rail::after {
  content: "";
  display: block;
  height: 1px;
  margin-top: 6px;
  background: linear-gradient(to right, transparent, var(--shell-border), transparent);
}
```

- [ ] **Step 2: Update Zone A markup in mission-panel.tsx**

Replace the Zone A wrapper:

```tsx
      <div className="shrink-0 w-full px-4 pt-[max(env(safe-area-inset-top),12px)]">
```

with:

```tsx
      <div className="shell-header-rail shrink-0 w-full">
```

- [ ] **Step 3: Verify build and visual check**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds.

Open in browser at mobile viewport (390px). Verify:
- Header rail now has `mx-2` equivalent padding (8px = `px-2`)
- Subtle gradient divider line appears below the hero rail
- Piece selector still functions (tap to switch piece)
- Gap between header and board is 4px (`--shell-gap-xs`)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "style: anchor header rail with gradient divider and aligned margins

Wolfcito 🐾 @akawolfcito"
```

---

### Task 6: Unify spacing + dock alignment

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx` (board wrapper margins, gap between GameplayPanel and dock)
- Modify: `apps/web/src/app/globals.css` (dock border token, remove chesscito-footer styles)
- Modify: `apps/web/src/components/play-hub/persistent-dock.tsx` (no code change needed — CSS handles it)

- [ ] **Step 1: Update board wrapper margins**

In `mission-panel.tsx`, replace the Zone B board wrapper:

```tsx
      <div className="min-h-0 flex-1 px-1 mt-1">
        <div className="h-full rounded-xl overflow-hidden border border-white/[0.04] shadow-[inset_0_0_40px_rgba(0,0,0,0.3),0_4px_20px_rgba(0,0,0,0.25)]">
```

with:

```tsx
      <div className="min-h-0 flex-1 mx-2">
        <div className="h-full overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.3),0_4px_20px_rgba(0,0,0,0.25)]" style={{ borderRadius: "var(--shell-radius)", border: "1px solid var(--shell-border)" }}>
```

- [ ] **Step 2: Add spacing margins to GameplayPanel**

In `apps/web/src/components/play-hub/gameplay-panel.tsx`, update the outer div to include orbit spacing tokens. No wrapper divs — the region itself owns its spacing per the spec's containment constraint. Replace:

```tsx
    <div
      className="mx-2 overflow-hidden"
      style={{
        borderRadius: "var(--shell-radius)",
        border: "1px solid var(--shell-border)",
        background: "var(--surface-c-light)",
      }}
    >
```

with:

```tsx
    <div
      className="mx-2 overflow-hidden"
      style={{
        borderRadius: "var(--shell-radius)",
        border: "1px solid var(--shell-border)",
        background: "var(--surface-c-light)",
        marginTop: "var(--shell-gap-xs)",
        marginBottom: "var(--shell-gap-sm)",
      }}
    >
```

- [ ] **Step 3: Update dock CSS to use shell tokens**

In `globals.css`, replace the `.chesscito-dock` `border-top` value (line 630):

```css
    border-top: 1px solid rgba(160, 205, 225, 0.10);
```

with:

```css
    border-top: 1px solid var(--shell-border);
```

- [ ] **Step 4: Update dock padding for column alignment**

In `globals.css`, replace the `.chesscito-dock` padding (line 629):

```css
    padding: 6px 12px calc(4px + env(safe-area-inset-bottom));
```

with:

```css
    padding: 6px 8px 4px;
```

This aligns dock internal content with the `mx-2` (8px) gutters used by all other regions. The `safe-area-inset-bottom` is now handled by the dock's parent wrapper in mission-panel.tsx.

- [ ] **Step 5: Remove the chesscito-footer class**

In `globals.css`, delete or comment out the `.chesscito-footer` block (lines 618-622):

```css
  .chesscito-footer {
    background: var(--surface-c-heavy);
    border-top: 1px solid rgba(160, 205, 225, 0.10);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
```

This class is no longer used — GameplayPanel and dock each own their own surfaces now.

- [ ] **Step 6: Remove duplicate hardcoded border values in dock items**

In `globals.css`, replace the dock item `border` value (line 647):

```css
    border: 1px solid rgba(255, 255, 255, 0.10);
```

with:

```css
    border: 1px solid var(--shell-border);
```

Also replace the `.chesscito-dock-center` border (line 672):

```css
    border: 1px solid rgba(255, 255, 255, 0.10);
```

with:

```css
    border: 1px solid var(--shell-border);
```

- [ ] **Step 7: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 8: Full visual regression check**

Open in browser at mobile viewport (390px). Verify the complete shell reads as one cohesive surface:
- Header rail: anchored with gradient divider, `px-2` margins
- Board: `mx-2`, `border-radius: 16px`, `border` uses `--shell-border`, inset shadow retained
- 4px gap between header→board and board→GameplayPanel
- GameplayPanel: `mx-2`, `border-radius: 16px`, `--shell-border`, `surface-c-light` background
  - Mission slot: wolf icon + text renders
  - Stats slot: exercise drawer trigger + score + time
  - Action slot: CTA renders for all states
  - Internal dividers visible between slots
- 8px gap between GameplayPanel→dock
- Dock: edge-to-edge, `border-top` uses `--shell-border`, items aligned with content column
- No empty rows when slots are conditionally empty
- Safe area insets still work (top for header, bottom for dock)

- [ ] **Step 9: Run existing tests to confirm no regressions**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && pnpm test`
Expected: All tests pass (27 server + 15 context-action + others).

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/components/play-hub/mission-panel.tsx apps/web/src/components/play-hub/gameplay-panel.tsx
git commit -m "style: unify shell spacing with tokens, align dock, remove chesscito-footer

Wolfcito 🐾 @akawolfcito"
```

---

## Summary

| Task | Phase | Files | What changes |
|------|-------|-------|-------------|
| 1 | Token system | `globals.css` | Add 5 shell tokens to `:root` |
| 2 | GameplayPanel | new `gameplay-panel.tsx` | Create component with 3 slots |
| 3 | Mission migration | `mission-panel.tsx` | Move mission card into GameplayPanel |
| 4 | Stats + CTA consolidation | `mission-panel.tsx` | Move stats/CTA into GameplayPanel, strip footer |
| 5 | Header anchoring | `mission-panel.tsx`, `globals.css` | Anchor header with divider + aligned margins |
| 6 | Spacing + dock | `mission-panel.tsx`, `globals.css`, `gameplay-panel.tsx` | Token gaps, board margins, dock alignment |
