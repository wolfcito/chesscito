# Phase C — Secondary Screen Cohesion (Premium Visual Layer)

**Date:** 2026-03-29
**Spec:** `docs/superpowers/specs/2026-03-28-premium-visual-layer-design.md` (Section 8)
**Status:** Draft
**Effort:** M (CSS class swaps on 3 sheet components, no logic changes)
**Depends on:** Phase B (shipped, `4a7dd37`)

## Objective

Align leaderboard, badge, and shop sheets to the panel tier system and shell tokens. After this phase, secondary screens feel family-consistent with the Play Hub — same material language, same border/radius/shadow vocabulary.

## Scope — What Changes

1. Leaderboard rows -> `panel-base`
2. Badge cards -> `panel-base` (locked), `panel-elevated` (claimable/claimed)
3. Shop items -> `panel-base` (regular), `panel-elevated` (featured)
4. Sheet headers -> `--shell-border` token alignment
5. Sheet CTAs -> CTA tier system alignment

## Scope — What Stays

- Sheet-specific background images (each sheet keeps its scene identity)
- Sheet open/close animations
- Overall sheet layouts (bottom sheet pattern, header/content/footer)
- Badge image treatments (`badge-treat-owned`/`claimable`/`locked` — already in system)
- Shop featured item warm color identity (golden tint preserved)

## Out of Scope

- Victory flow, coach screens, loading/progress states
- Modal trap fixes, reward spectacle redesign
- Full sheet layout redesign
- Button variant refactoring

## Current State

### Leaderboard (`leaderboard-sheet.tsx`)
- Rows: `border border-white/[0.08] bg-white/[0.04] rounded-xl px-3 py-2.5` — ad-hoc
- Header: `border-[var(--header-zone-border)] bg-[var(--header-zone-bg)]` — already token-aligned
- Retry CTA: inline `text-cyan-300/70 underline` — ghost-tier text link, acceptable

### Badges (`badge-sheet.tsx`)
- Claimed card: inline gradient `rgba(10,22,18,0.85)` + emerald border + elaborate inline shadow
- Claimable card: inline gradient `rgba(10,18,28,0.85)` + cyan border + inline shadow
- Locked card: `bg-white/[0.03] border-white/[0.06]` + minimal shadow
- Claim CTA: `variant="game-solid"` — correct tier
- View Trophies CTA: inline amber `bg-amber-500/[0.08] ring-1 ring-amber-400/15` — secondary-tier, acceptable
- Header: already token-aligned

### Shop (`shop-sheet.tsx`)
- Featured item: inline golden gradient + `1.5px solid rgba(200,170,100,0.30)` + elaborate shadow
- Regular items: `border-white/[0.05] bg-white/[0.02] opacity-75` — ad-hoc
- Buy CTA: `variant="game-solid" size="game"` — correct tier
- Header: already token-aligned

## Design Decisions

### Leaderboard rows -> `panel-base`

Replace: `rounded-xl border border-white/[0.08] bg-white/[0.04]`
With: `panel-base`

`panel-base` provides: gradient background (stronger than flat 4% white), `--shell-border`, `--shell-radius` (16px), `--treat-carved-lo`. The rows will feel more constructed.

Keep: `grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5` — layout stays.

### Badge cards -> `panel-base` / `panel-elevated` by state

**Locked** -> `panel-base`
Replace: `bg-white/[0.03] border-white/[0.06]` + inline shadow
With: `panel-base` — provides gradient, shell-border, carved-lo

**Claimable** -> `panel-elevated`
Replace: inline cyan gradient + border + elaborate shadow
With: `panel-elevated` — provides stronger gradient, brighter border (0.08), carved-hi+lo+depth-outer, light rim
Keep: cyan accent border override via `border-cyan-400/25` on top of panel border (or remove if panel border is sufficient — visual review decides)

**Claimed** -> `panel-elevated`
Replace: inline emerald gradient + border + elaborate shadow
With: `panel-elevated` — same material as claimable
Keep: emerald accent via `border-emerald-500/25` override

**Reasoning:** Spec Section 7 says claimed and claimable both use `panel-elevated`. Locked uses `panel-base`. The difference between claimed and claimable comes from the badge image treatment (`badge-treat-owned` vs `badge-treat-claimable`), not from the card surface.

**Simplification opportunity:** If claimed and claimable use the same `panel-elevated`, we can collapse the 3-way card style conditional to 2-way: `isLocked ? "panel-base" : "panel-elevated"`. The badge image treatment already communicates the state.

### Shop items -> `panel-base` / `panel-elevated`

**Regular items** -> `panel-base`
Replace: `border-white/[0.05] bg-white/[0.02] opacity-75`
With: `panel-base` — remove `opacity-75` (panel gradient handles subordination)

**Featured item** -> `panel-elevated`
Replace: inline golden gradient + golden border + elaborate 4-layer shadow
With: `panel-elevated` as base material + warm accent overrides

The featured item has a strong warm identity. Approach:
- Use `panel-elevated` for material structure (gradient, radius, carved shadows)
- Override border to `1px solid var(--treat-warm-border)` for golden accent
- Add `shadow-[0_0_12px_rgba(200,170,100,0.10)]` for subtle warm glow
- Keep featured badge positioning and golden text colors

This preserves warm identity while using panel-tier structure.

### Sheet headers

Headers already use `--header-zone-bg` and `--header-zone-border`. These are close to but not identical to `--shell-border` (`rgba(255,255,255,0.08)` vs `rgba(255,255,255,0.06)`).

Decision: Keep `--header-zone-*` tokens as-is. They intentionally differ from `--shell-border` because sheet headers sit on blurred backgrounds where slightly more contrast is needed. No change.

### Sheet CTAs

Current state:
- Leaderboard retry: ghost text link — maps to Ghost tier. Already correct.
- Badge claim: `game-solid` — maps to Secondary tier. Already correct.
- Badge "View Trophies": inline amber secondary — maps to Secondary tier. Already correct.
- Shop buy: `game-solid` — maps to Secondary tier. Already correct.
- Badge "About" link: ghost text — maps to Ghost tier. Already correct.

No CTA changes needed. All sheet CTAs already follow the 3-tier system.

## Implementation Steps

### Step 1 — Leaderboard rows to `panel-base`

**File:** `leaderboard-sheet.tsx`, line 98

```tsx
// Before
<div key={row.rank} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">

// After
<div key={row.rank} className="panel-base grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5">
```

Remove: `rounded-xl`, `border border-white/[0.08]`, `bg-white/[0.04]` — all provided by `panel-base`.

### Step 2 — Badge cards to `panel-base` / `panel-elevated`

**File:** `badge-sheet.tsx`, lines 68-82

Replace the 3-state `borderClassName` + inline `background` + `boxShadow` with panel classes:

- Locked: `panel-base` + keep `opacity-60` or similar for subdued feel
- Claimable: `panel-elevated`
- Claimed: `panel-elevated`

Remove all inline `background`, `boxShadow` style props from the card wrapper. Keep `rounded-2xl px-3 py-3` layout and the state-specific accent borders only if needed after visual review.

The badge image treatments (`badge-treat-owned`/`claimable`/`locked`) stay untouched — they already communicate state.

### Step 3 — Shop items to `panel-base` / `panel-elevated`

**File:** `shop-sheet.tsx`, line 60

**Regular items:**
```tsx
// Before
className="rounded-2xl p-3 relative border border-white/[0.05] bg-white/[0.02] opacity-75"

// After
className="panel-base p-3 relative"
```

**Featured item:**
```tsx
// Before
className="rounded-2xl p-3 relative"
style={{ background: "linear-gradient(...)", border: "1.5px solid rgba(200,170,100,0.30)", boxShadow: "..." }}

// After
className="panel-elevated p-3 relative"
style={{ borderColor: "var(--treat-warm-border)" }}
```

Keep the golden featured badge, title color, and the buy button's amber glow shadow.

### Step 4 — Sheet header divider token alignment

Verify all 3 sheets use `border-[var(--header-zone-border)]`. They already do. No changes needed.

### Step 5 — Build verification

```bash
cd apps/web && pnpm build
```

### Step 6 — Visual review gate

- [ ] Leaderboard rows feel consistent with Play Hub secondary surfaces
- [ ] Badge locked cards are clearly subordinate to claimable/claimed
- [ ] Badge claimable/claimed cards have visible elevation over locked
- [ ] Badge image treatments still communicate state clearly
- [ ] Shop featured item retains warm golden identity while feeling panel-aligned
- [ ] Shop regular items feel subordinate to featured
- [ ] All sheet borders and radius feel consistent with Play Hub
- [ ] Text contrast preserved on all new panel backgrounds
- [ ] All CTAs remain legible and tappable (min 44px)
- [ ] No sheet feels like it belongs to a different app
- [ ] Sheet close button remains visible and tappable

**Rollback rule:** If a sheet loses its identity or a state becomes ambiguous, restore the accent override or revert to previous styling for that element.

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/components/play-hub/leaderboard-sheet.tsx` | Row className: `panel-base` |
| `apps/web/src/components/play-hub/badge-sheet.tsx` | Card className: `panel-base` (locked) / `panel-elevated` (claimable/claimed), remove inline gradients/shadows |
| `apps/web/src/components/play-hub/shop-sheet.tsx` | Regular: `panel-base`, featured: `panel-elevated` + warm border override, remove inline gradients/shadows |

## Commits (expected)

1. `style: adopt panel-base on leaderboard rows`
2. `style: adopt panel tiers on badge cards by state`
3. `style: adopt panel tiers on shop items`

## Risks

- **Badge state ambiguity:** If claimed and claimable cards look identical after removing inline gradients, the badge image treatment must carry the full state signal. It already does (warm gold vs semi-warm vs grayscale), but verify visually.
- **Shop featured item identity loss:** The warm golden gradient is a strong identity element. If `panel-elevated` + warm border override doesn't feel special enough, add back a subtle warm glow via `shadow-[0_0_12px_rgba(200,170,100,0.10)]`.
- **`panel-base` border-radius:** `--shell-radius` is 16px. Leaderboard rows currently use `rounded-xl` (12px). This changes to 16px. Should be fine — more consistent — but verify spacing between rows.

## Not In Scope

- Victory flow / coach screens — separate scope
- Modal trap fixes — separate scope
- Reward spectacle — Phase D
- Button variant refactoring — CTAs already aligned
- Sheet layout redesign — only material alignment
