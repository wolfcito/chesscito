# UX Overhaul: Floating HUD Layout — Design

**Goal:** Restructure the play-hub from 6 stacked blocks into 3 visual zones (floating HUD, hero board, bottom dock) so the UI feels spacious and layered instead of cramped.

**Approach:** Floating HUD (Approach A) — board dominates ~60% of viewport, all other UI floats over the continuous background scene. CSS-only restructuring, no logic or API changes.

**Constraints:** Mobile-first 390px viewport, no new art assets, no component API changes.

---

## Architecture: 3-Zone Layout

```
┌──────────────────────────────┐
│ ZONE 1: Floating HUD         │  compact pill bar, frosted glass
│ (piece selector + level)      │  ~40px height
├──────────────────────────────┤
│                               │
│ ZONE 2: Board Stage           │  flex:1, hero zone
│ (board + inline progress bar) │  gets ALL remaining space
│                               │
├──────────────────────────────┤
│ ZONE 3: Bottom Dock           │  frosted glass panel
│ (stats row + action buttons)  │  ~120px height
└──────────────────────────────┘
```

Background scene (`bg-chesscitov3`) runs continuously behind all zones — no per-section backgrounds.

---

## Zone 1: Floating HUD (Piece Selector + Level)

**Before:** Individual `mission-chip` buttons each with own bg + border, level badge separate.

**After:** Single translucent pill bar.

- Container: `rounded-2xl bg-slate-950/40 backdrop-blur-md`, no individual button backgrounds
- Selected piece: text glow + bottom underline indicator (no background-image per button)
- Unselected: plain text, `opacity-50`
- Level badge: right-aligned inside same bar
- Height: ~40px total

---

## Zone 2: Board Stage (Hero)

**Before:** Board in `flex-1` div wrapped in `playhub-game-stage` border, stars bar below with `mt-2` gap.

**After:**

- Remove `playhub-game-stage` cyan border (visual noise)
- Board canvas keeps aspect ratio, gets more vertical room
- Progress bar sits flush below board (zero gap) — thin 3px amber line
- Exercise dots become numbered markers embedded on the bar line

```
     ╔══════════════════╗
     ║     BOARD        ║
     ╚══════════════════╝
     ━━●━━●━━●━━●━━●━━━━  ← 3px bar with 5 dot markers
```

---

## Zone 3: Bottom Dock (Stats + Actions)

**Before:** Stats bar (3-column grid with border dividers) + action buttons (flex row), separated by `mt-2`.

**After:** Single frosted-glass dock panel with two rows.

- Container: `rounded-t-2xl bg-slate-950/50 backdrop-blur-lg shadow-[0_-8px_32px_rgba(0,0,0,0.3)] border-t border-white/5`
- Stats row: horizontal single line, labels as tiny superscript (`text-[0.55rem]`), values bold, no grid borders — spacing only
- Action icons: `h-14 w-14`, evenly spaced with `justify-around`
- `safe-area-inset-bottom` padding for phones with home bar
- Total height: ~120px

---

## Depth & Spacing System

| Element | Treatment |
|---------|-----------|
| Background scene | Full bleed, `bg-chesscitov3`, continuous |
| Floating HUD | `bg-slate-950/40 backdrop-blur-md`, no border |
| Board canvas | Clean, no border wrapper |
| Progress bar | Flush below board, 3px, no container |
| Bottom dock | `bg-slate-950/50 backdrop-blur-lg border-t border-white/5` |
| Action buttons | `bg-white/8` on hover, no permanent bg (except primary) |

**Remove:**
- `.mission-chip` bg on unselected piece buttons
- `.playhub-game-stage` border
- `.chesscito-stats-item + .chesscito-stats-item` border dividers
- Individual `mt-2` gaps between sections

**Add:**
- `safe-area-inset-bottom` padding on dock
- Dock upward shadow for depth
- Consistent 8px spacing rhythm

---

## Files to Modify

- `apps/web/src/app/globals.css` — restructure layout classes, remove visual noise, add dock styles
- `apps/web/src/components/play-hub/mission-panel.tsx` — 3-zone layout, remove stacking gaps
- `apps/web/src/components/play-hub/exercise-stars-bar.tsx` — inline progress bar with dot markers
- `apps/web/src/components/play-hub/onchain-actions-panel.tsx` — dock layout, bigger icons, no borders on stats
- `apps/web/src/components/board.tsx` — remove stage border wrapper if applied there

## Non-goals

- No logic changes
- No new art assets
- No component API changes
- No animations (future phase)
