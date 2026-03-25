# P1 Design Spec — HUD Redesign + Coach Overlay Stacking

**Date:** 2026-03-25
**Status:** Approved
**Scope:** Play-hub HUD bar game UI redesign + arena coach overlay z-index fix

---

## Part A: Play-Hub HUD Redesign

### Problem Statement

The current play-hub screen has flat visual hierarchy. All three zones (HUD bar, board, footer) compete at similar visual weight. The HUD bar is a horizontal row mixing piece selection, level, progress, and actions at the same scale. The footer stacks three separate layers (stats + CTA + dock), creating a heavy bottom. The board gets squeezed between two noisy toolbars.

### Design Principles (Hard Rules)

1. **1 glow per zone.** Top: hero piece. Bottom: CTA button. If two things glow, nothing glows.
2. **Hero dominates the top.** The active piece is the largest, brightest, most prominent element in the header.
3. **Utility band cannot grow or gain weight.** It is metadata. No backgrounds, no borders, no glow. If it starts feeling like a toolbar, strip it back.
4. **CTA is the only dominant in the footer.** Stats are micro-reference. Dock is silent navigation.
5. **Board is the visual nucleus.** Every layout decision serves maximizing board space and presence.
6. **Mission target is data, not a phrase.** Presented as label/value pair where the coordinate is the focus, not the verb.
7. **Max 3 tiers of visual hierarchy.** Hero (bright), Support (muted), Utility (near-invisible).

### Layout: 4 Zones

#### Zone A — Hero Selector (top, centered)

Centered piece selector. Active piece is the only "hero" element on screen.

**Pieces:**
- Active (hero): `64px` circle, `2px` cyan border, `box-shadow: 0 0 16px rgba(34,211,238,0.20)`, bright icon
- Inactive (support): `36px` circle, `1px rgba(255,255,255,0.06)` border, no glow, `opacity: 0.30`
- Locked: same as inactive + `14px` lock badge on top-right
- Gap between pieces: `8px`
- Active piece shows label inside: piece name in `7px` uppercase tracking

**Validation variants to test during implementation:**
- Hero at `56px` vs `64px` — verify 64 doesn't crowd the row with 3 pieces on 390px

**Mission target (inside hero block):**

```
     MOVE TO        ← 9px, weight 600, tracking 0.16em, uppercase, cyan/35%
       e5           ← 18px, weight 800, cyan/90%, text-shadow: 0 0 12px cyan/20%
```

- Gap from piece to label: test `8px` and `10px`, pick whichever reads cleaner without losing compactness
- Gap from label to target value: `2px` (single visual block)
- Target glow must be weaker than hero piece glow (max `cyan/20%` shadow vs piece's `cyan/20%` — if they feel equal, reduce target to `cyan/12%`)
- When tutorial is active: label becomes tutorial text, target hides. Same position, same scale.

#### Zone A2 — Utility Band

Thin strip below hero. Pure metadata reference.

- Height: `28px` total including padding
- Background: **none** — fully transparent, no border, no blur
- Horizontal padding: `16px` (aligned with hero block)
- Left: `Lv 3` — `11px`, weight 700, `purple/50%`
- Right: stars chip `⭐ 7/45` — `10px`, weight 700, `amber/60%`, border `amber/15%`, `h-24px`, `rounded-full` | more button — `24px` circle, `white/3%` bg, `white/6%` border, `opacity: 0.35`

#### Zone B — Board Stage (center, flex-1)

- Fills all remaining vertical space
- Horizontal padding: test `4px` and `6px` during implementation, pick the one that balances edge-to-edge impact with lateral breathing
- Piece hint renders above board when present
- Practice label below board when replay (`text-[0.6rem]`, `cyan/50%`)
- No additional overlays or decorative elements around the board

#### Zone C — Footer (2 layers, merged from 3)

**Layer 1 — Micro-stats + CTA (merged):**

Stats:
- Score (star icon + value) and Timer (clock icon + value) only
- `10px`, weight 600, `white/35%`
- Icons: `12px`, `opacity: 0.25`
- Divider: center dot `·` (not a line)
- Centered, `gap: 16px`
- No text-shadow, no glow

Target (crosshair) is **removed from footer** — it now lives in the hero block.

CTA:
- `48px` height, full-width with `mx-12px`
- `border-radius`: test `14px` and `16px` during implementation, pick the one that feels more premium/touchable
- Gradient cyan background, `box-shadow: 0 0 20px rgba(6,182,212,0.25)`
- `13px` text, weight 700, uppercase
- **Only bright element in the footer**

**Layer 2 — Dock (navigation):**
- Unchanged structurally from current implementation
- Items: `44px` touch targets
- General opacity lowered: items at `0.30` resting state
- Center (Arena) keeps subtle teal glow

### Spacing System

```
safe-area-top
  12px ← top padding
╔═══════════════════════════════╗
║  Hero Selector (~110px)      ║  64px piece + gap + label + target
╚═══════════════════════════════╝
  0px ← hero and utility are one logical group
┌───────────────────────────────┐
│  Utility Band (28px)         │
└───────────────────────────────┘
  8px ← minimal gap before board
╔═══════════════════════════════╗
║  Board (flex-1)              ║  takes all remaining space
║  padding: 0 4-6px            ║
╚═══════════════════════════════╝
  0px ← footer bg creates separation
┌───────────────────────────────┐
│  8px padding-top              │
│  micro-stats                  │
│  6px                          │
│  CTA (48px)                   │
│  6px                          │
│  ─── border ───               │
│  Dock (44px items)            │
│  safe-area-bottom             │
└───────────────────────────────┘
```

| Separation | Value | Rationale |
|---|---|---|
| Safe area to hero | `12px` | Breathing room without wasting on chrome |
| Hero to utility | `0px` | Same logical group, visual hierarchy separates them |
| Utility to board | `8px` | Board should start as soon as possible |
| Board to footer | `0px` | Footer background creates visual boundary |
| Footer top padding | `8px` | Before micro-stats |
| Stats to CTA | `6px` | Tight — they are one unit |
| CTA to dock border | `6px` | Quick transition |
| Board horizontal | `4-6px` (test both) | Near edge-to-edge, maximum board presence |
| Hero horizontal | `16px` | Centered with lateral air |

### Scale System

| Tier | Size | Opacity | Glow | Elements |
|---|---|---|---|---|
| **Hero** | 64px, 18px text | 90-100% | Yes (1 per zone) | Active piece, target "e5", CTA button |
| **Support** | 36-44px, 13px text | 30-40% | No | Inactive pieces, dock items |
| **Utility** | 24-28px, 10-11px text | 25-35% | No | Lv, stars, more, micro-stats, stat icons |

### Color & Emphasis

| Level | Opacity | Glow | Applies to |
|---|---|---|---|
| Primary (1 per zone) | 100% | Cyan border glow | Hero piece, CTA button |
| Secondary | 30-40% | None | Inactive pieces, stats values |
| Tertiary | 20-30% | None | Level text, more btn, stat icons, dividers |

### Element Migration

| Element | Before | After |
|---|---|---|
| Piece selector | 44px left-aligned tabs in `.hud-bar` | 64px centered hero circle, no container bg |
| Piece label | Text next to icon on active tab | Inside 64px hero circle |
| Mission target | Footer crosshair stat item | Hero block subtitle (label + bold value) |
| pieceHint | Separate `<p>` above board | Becomes mission label when tutorial active |
| Level badge | Chip with glow in HUD bar | Plain `Lv 3` text in utility band |
| Exercise drawer trigger | Chip in HUD bar right cluster | Stars chip in utility band right |
| More button | 44px in HUD bar right cluster | 24px in utility band right edge |
| Footer target (crosshair) | Stat item in footer strip | **Removed** — lives in hero block now |
| Footer stats + CTA | 2 separate layers | 1 merged layer |
| `.hud-bar` container | Dark bg with blur | **Removed** — pieces float on game bg |

### Validation Variants (test during implementation)

These are A/B choices to resolve during build, not design disagreements:

1. **Hero gap:** `8px` vs `10px` from piece to mission label
2. **Target glow:** `cyan/20%` vs `cyan/12%` text-shadow (must be weaker than piece)
3. **CTA radius:** `14px` vs `16px`
4. **Board padding:** `4px` vs `6px` horizontal

---

## Part B: Coach Overlay Stacking Fix

### Problem Statement

When the user wins an arena game and opens the coach, two fixed overlays stack:
- `z-50`: Victory celebration (ArenaEndState with `fixed inset-0`, scrim background)
- `z-[60]`: Coach overlay (any coach phase with `fixed inset-0`, scrim background)

This creates double-darkening and two full-screen panels layered on top of each other.

### Solution: Hide + Restore with Smart Navigation

**Behavior:**

1. When any coach phase activates (`coachPhase !== "idle"`), the end-state overlay gets `opacity-0 pointer-events-none` (hidden but not unmounted).
2. When the user closes the coach (back to `coachPhase === "idle"`), the end-state restores to `opacity-100 pointer-events-auto`.
3. When the user takes a navigation action FROM the coach ("Play Again", "Back to Hub"), navigate directly to the destination. Do NOT restore the victory screen — it's no longer relevant.

**Implementation approach:**

In `arena/page.tsx`, derive a visibility flag:

```typescript
const hideEndState = coachPhase !== "idle";
```

Apply to the ArenaEndState wrapper:

```tsx
<div className={hideEndState ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}>
  <ArenaEndState ... />
</div>
```

The coach overlay components already have `onPlayAgain` and `onBackToHub` props that navigate directly, so no changes needed there.

**Why not unmount the end-state:**
- Unmounting loses claim phase state (tokenId, txHash, share data)
- User might want to return to claim/share after reviewing coach analysis
- CSS visibility toggle is simpler and preserves all state

### Z-index inventory (unchanged)

| Layer | z-index | Element |
|---|---|---|
| Phase flash | `z-50` | PhaseFlash overlay (auto-fades) |
| End state | `z-50` | ArenaEndState (victory/loss) |
| Coach overlays | `z-[60]` | All coach phases (welcome, loading, result, fallback, paywall) |

No z-index changes needed. The visibility toggle solves the stacking without restructuring layers.

---

## Out of Scope

- Arena HUD redesign (future: extend hero selector pattern to arena)
- Footer dock redesign (structural changes — only opacity tuning in this spec)
- New animations or transitions (future iteration)
- Exercise drawer sheet content redesign
- Desktop viewport considerations
