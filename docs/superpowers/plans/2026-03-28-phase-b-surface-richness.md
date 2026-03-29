# Phase B — Surface Richness

**Date:** 2026-03-28
**Spec:** `docs/superpowers/specs/2026-03-28-premium-visual-layer-design.md` (Sections 3, 4, 5, 6, 9)
**Status:** Approved
**Effort:** M (CSS definitions + class adoption on ~5 components + treatment wiring)
**Depends on:** Phase A (shipped, `de739a1`)

## Objective

Replace ad-hoc inline surface styling with a 3-tier material system. Activate reserved interaction treatments. After this phase, Play Hub surfaces feel built and layered — not flat.

## Current State

- **GameplayPanel** (`gameplay-panel.tsx`): inline `background: var(--surface-c-light)`, `border: 1px solid var(--shell-border)`, `borderRadius: var(--shell-radius)`
- **ResultOverlay** (`result-overlay.tsx`): `bg-[var(--surface-frosted)]`, `border-white/[0.06]`, `backdrop-blur-2xl`, `rounded-3xl`
- **BadgeEarnedPrompt** (`result-overlay.tsx`): no card surface at all (content floats over scrim)
- **Board stage** (`mission-panel.tsx:227`): `shadow-[inset_0_0_40px...]`, inline border + radius
- **Exercise items** (`exercise-drawer.tsx`): ad-hoc `bg-white/[0.05]`, `bg-white/[0.03]`, `bg-cyan-500/18` per state
- **Dock items**: native `:active` pseudo-class only, no filter treatments
- **Piece pressed**: class defined but not wired to any interaction
- **Reserved classes**: `piece-pressed`, `dock-treat-active`, `dock-treat-pressed`, `frame-structural`, `frame-showcase` — all defined in CSS, none activated in components

## Design (from spec Section 3)

### `panel-base` — secondary containers

```css
.panel-base {
  background: linear-gradient(to bottom, rgba(12, 20, 35, 0.50), rgba(6, 14, 28, 0.40));
  border: 1px solid var(--shell-border);
  border-radius: var(--shell-radius);
  box-shadow: var(--treat-carved-lo);
}
```

### `panel-elevated` — primary interactive modules

```css
.panel-elevated {
  background: linear-gradient(to bottom, rgba(12, 20, 35, 0.65), rgba(6, 14, 28, 0.55));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--shell-radius);
  box-shadow:
    var(--treat-carved-hi),
    var(--treat-carved-lo),
    var(--treat-depth-outer);
  /* Light rim — top edge highlight */
  background-clip: padding-box;
}
.panel-elevated::after {
  content: "";
  position: absolute;
  top: 0;
  left: 1px;
  right: 1px;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  pointer-events: none;
  border-radius: var(--shell-radius) var(--shell-radius) 0 0;
}
```

Note: the light rim uses a `::after` pseudo-element. Components that already use `::after` for other purposes will skip the rim (e.g., board stage).

### `panel-showcase` — rewards, celebrations, high-emphasis modals

```css
.panel-showcase {
  background: linear-gradient(to bottom, rgba(14, 22, 38, 0.80), rgba(6, 14, 28, 0.70));
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: var(--shell-radius);
  box-shadow:
    var(--treat-carved-hi),
    var(--treat-carved-lo),
    var(--treat-depth-outer);
}
.panel-showcase::after {
  content: "";
  position: absolute;
  top: 0;
  left: 1px;
  right: 1px;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
  border-radius: var(--shell-radius) var(--shell-radius) 0 0;
}
```

## Spec Rules (hard constraints)

1. No surface in the app should have ad-hoc styling outside this tier system (Phase B covers Play Hub only; sheets are Phase C)
2. Glow never becomes primary hierarchy source — hierarchy from gradient weight, border, carved depth
3. Only one showcase surface per viewport at a time
4. `frame-structural` maps to `panel-base`, `frame-showcase` maps to `panel-showcase`
5. Pressed feedback: consistent 120ms, scale(0.92) across pieces, dock, buttons
6. All effects: compositor-friendly (`opacity`, `transform` only for animations)
7. `prefers-reduced-motion: reduce` disables scale transitions

## Implementation Steps

### Step 1 — Define panel tiers in globals.css

Add `panel-base`, `panel-elevated`, `panel-showcase` to `@layer components`.

Place after the `.atmosphere` section, before `/* -- Arena background -- */`.

Both `panel-elevated` and `panel-showcase` need `position: relative` for their `::after` light rim. `panel-base` does not need pseudo-elements.

### Step 2 — Adopt `panel-elevated` on GameplayPanel

**File:** `gameplay-panel.tsx`

Replace inline styles with class:

```tsx
// Before
<div
  className="mx-2 shrink-0 overflow-hidden"
  style={{
    borderRadius: "var(--shell-radius)",
    border: "1px solid var(--shell-border)",
    background: "var(--surface-c-light)",
    marginTop: "var(--shell-gap-xs)",
    marginBottom: "var(--shell-gap-sm)",
  }}
>

// After
<div
  className="panel-elevated relative mx-2 shrink-0 overflow-hidden"
  style={{
    marginTop: "var(--shell-gap-xs)",
    marginBottom: "var(--shell-gap-sm)",
  }}
>
```

`panel-elevated` provides: background gradient, border, border-radius, box-shadow, light rim. Margin tokens stay inline because they're layout-specific, not material.

### Step 3 — Adopt `panel-showcase` on ResultOverlay card

**File:** `result-overlay.tsx`

Replace ad-hoc card styling on the inner modal (line 181):

```tsx
// Before
<div className="flex w-full max-w-xs flex-col items-center gap-6 rounded-3xl border border-white/[0.06] bg-[var(--surface-frosted)] px-6 py-10 text-center backdrop-blur-2xl animate-in zoom-in-95 fade-in duration-350">

// After (success variants)
<div className={`panel-showcase relative flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center animate-in zoom-in-95 fade-in duration-350 ${isError ? "!bg-[var(--surface-frosted)] !border-white/[0.06] backdrop-blur-2xl" : ""}`}>
```

Wait — this is getting complex. Cleaner approach:

- **Success variants** (badge/score/shop): use `panel-showcase`
- **Error variant**: use `panel-elevated` (spec Section 7 Rule 4: failure uses `panel-elevated`, no glow, no sparkles)

Split the className conditionally:

```tsx
<div className={`relative flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center animate-in zoom-in-95 fade-in duration-350 ${isError ? "panel-elevated" : "panel-showcase"}`}>
```

Remove: `rounded-3xl` (panel classes provide `--shell-radius`), `border border-white/[0.06]` (panel provides border), `bg-[var(--surface-frosted)]` (panel provides gradient), `backdrop-blur-2xl` (not needed with opaque gradients).

### Step 4 — Adopt `panel-showcase` on BadgeEarnedPrompt card

**File:** `result-overlay.tsx`, `BadgeEarnedPrompt` (line 305)

Currently has no card surface. Wrap content in `panel-showcase`:

```tsx
// Before
<div className="flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center animate-in zoom-in-95 fade-in duration-350">

// After
<div className="panel-showcase relative flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center animate-in zoom-in-95 fade-in duration-350">
```

### Step 5 — Adopt `panel-base` on board stage container

**File:** `mission-panel.tsx`, line 227-229

```tsx
// Before
<div className="h-full overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.3),0_4px_20px_rgba(0,0,0,0.25)]"
  style={{ borderRadius: "var(--shell-radius)", border: "1px solid var(--shell-border)" }}>

// After
<div className="panel-base h-full overflow-hidden">
```

`panel-base` provides border, radius, and carved shadow. The elaborate inset shadow is replaced by the tier's `--treat-carved-lo`.

**Hierarchy rule:** Board stage uses `panel-base` only as restrained framing, not as a hero surface. If during visual review the board frame begins to compete visually with GameplayPanel (`panel-elevated`), reduce `panel-base` opacity or remove box-shadow for this specific usage. The board itself is the dominant game surface; its frame must not become decorative noise.

### Step 6 — Wire `piece-pressed` to hero selector

**File:** `mission-panel.tsx`, piece button (~line 175-207)

Confirm `.piece-pressed` as a real system class (already defined at line 931). Add `transform: scale(0.92)` and `transition` to make it a complete pressed treatment. Then activate it through hero-rail selectors:

**File:** `globals.css` — update `.piece-pressed` definition:

```css
.piece-pressed {
  filter: brightness(0.90) saturate(0.85);
  box-shadow: var(--treat-carved-lo);
  transform: scale(0.92);
  transition: transform 120ms, filter 120ms, box-shadow 120ms;
}
```

**File:** `globals.css` — wire via active selectors:

```css
.hero-rail-tab:active .piece-hero,
.hero-rail-tab:active .piece-inactive {
  filter: brightness(0.90) saturate(0.85);
  box-shadow: var(--treat-carved-lo);
  transform: scale(0.92);
  transition: transform 120ms, filter 120ms, box-shadow 120ms;
}
```

This makes `.piece-pressed` both a standalone system class and auto-activated via `:active` on the rail.

`prefers-reduced-motion` disables scale only (grouped in Step 7).

### Step 7 — Wire `dock-treat-active` and `dock-treat-pressed` to dock icons

**File:** `globals.css` — update dock item rules

The dock icon images already have `dock-treat-base` class. Wire active and pressed states:

For **dock item buttons** (side items — badges, shop, leaderboard, invite):

```css
.chesscito-dock-item > button:active img,
.chesscito-dock-item > [role="button"]:active img {
  filter: brightness(0.65) saturate(0.6);   /* dock-treat-pressed values */
  transform: scale(0.92);
  transition: transform 120ms, filter 120ms;
}
```

For **dock center** (Arena/Free Play), the `.is-active` state should apply `dock-treat-active` filter to its icon:

```css
.chesscito-dock-center.is-active svg {
  /* Lucide icons: color + opacity only, no filter (spec Section 5) */
  color: rgba(160, 225, 220, 0.9);
  opacity: 1;
}

.chesscito-dock-center:active svg {
  /* Lucide icons: scale on press, no filter */
  transform: scale(0.92);
  transition: transform 120ms;
}
```

Add `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .chesscito-dock-item > button:active img,
  .chesscito-dock-item > [role="button"]:active img,
  .chesscito-dock-center:active svg,
  .hero-rail-tab:active .piece-hero,
  .hero-rail-tab:active .piece-inactive {
    transform: none;
  }
}
```

### Step 8 — Align reserved frame classes

**File:** `globals.css`

Spec rule: `frame-structural` maps to `panel-base`, `frame-showcase` maps to `panel-showcase`.

Align strictly to panel tiers. Frame classes inherit the material language of their corresponding tier; they may add frame-specific behavior (e.g., `filter` for image tint) but border, radius, and shadow must match the tier exactly:

```css
/* frame-structural: panel-base material + image tint */
.frame-structural {
  filter: var(--treat-neutral-tint);
  /* panel-base material language */
  border: 1px solid var(--shell-border);
  border-radius: var(--shell-radius);
  box-shadow: var(--treat-carved-lo);
}

/* frame-showcase: panel-showcase material + depth */
.frame-showcase {
  /* panel-showcase material language */
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: var(--shell-radius);
  box-shadow:
    var(--treat-carved-hi),
    var(--treat-carved-lo),
    var(--treat-depth-outer);
}
```

These are NOT a parallel fourth system — they are panel-tier material applied to image frame contexts.

### Step 9 — Build verification

```bash
cd apps/web && pnpm build
```

No new dependencies, no logic changes. Panel classes are CSS-only. Treatment wiring is CSS-only. Component changes are class swaps.

### Step 10 — Visual review gate

Manual MiniPay WebView review checklist:

- [ ] GameplayPanel feels elevated — visible carved depth + light rim + gradient
- [ ] GameplayPanel dividers still visible against new gradient background
- [ ] ResultOverlay (success) feels showcase — stronger material presence than GameplayPanel
- [ ] ResultOverlay (error) feels elevated, not showcase — no glow, rose text, dignified
- [ ] BadgeEarnedPrompt has visible card surface (was previously floating)
- [ ] Board stage has subtle `panel-base` framing — not visually competing with GameplayPanel
- [ ] Piece press feedback: tap piece selector and see scale(0.92) + dimming, 120ms
- [ ] Dock icon press feedback: tap any dock item and see scale(0.92) + dim, 120ms
- [ ] Dock center (Arena) active state: brighter icon when on `/arena` route
- [ ] Dock center press: scale(0.92) + dim on tap
- [ ] No two showcase surfaces visible simultaneously
- [ ] All tap targets remain confident (min 44px, clear feedback)
- [ ] Text contrast preserved on all new gradient backgrounds
- [ ] No jank during piece/dock press interactions
- [ ] `prefers-reduced-motion`: scale transitions disabled, gradients/shadows unaffected

**Rollback rule:** If material richness reduces clarity or tap confidence, reduce the tier (showcase -> elevated -> base) or remove the treatment.

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/app/globals.css` | Add `panel-base`, `panel-elevated`, `panel-showcase` classes + light rim pseudo-elements. Wire `piece-pressed` to hero-rail active. Wire dock icon treatments. Add `prefers-reduced-motion` rule. Align `frame-structural`/`frame-showcase` with `--shell-radius`. |
| `apps/web/src/components/play-hub/gameplay-panel.tsx` | Replace inline surface styles with `panel-elevated` class |
| `apps/web/src/components/play-hub/result-overlay.tsx` | Adopt `panel-showcase` (success) / `panel-elevated` (error) on ResultOverlay + `panel-showcase` on BadgeEarnedPrompt |
| `apps/web/src/components/play-hub/mission-panel.tsx` | Replace board stage inline styles with `panel-base` class |

## Commits (expected)

1. `style: define panel-base, panel-elevated, panel-showcase tier system`
2. `style: adopt panel-elevated on GameplayPanel, panel-base on board stage`
3. `style: adopt panel-showcase on ResultOverlay and BadgeEarnedPrompt`
4. `style: wire piece-pressed, dock-treat-active, dock-treat-pressed interactions`

## Risks

- **`panel-elevated::after` light rim conflicts**: Components using `position: relative` + their own `::after` could conflict. GameplayPanel has no `::after`, so it's safe. Board stage uses `panel-base` which has no `::after`.
- **ResultOverlay `backdrop-blur-2xl` removal**: The frosted glass effect goes away when switching to opaque panel gradients. The spec intentionally replaces frosted with material gradients — verify the visual is still premium.
- **Exercise drawer items**: NOT adopting `panel-base` in this phase. Their active/done/locked states are complex and exercise-specific. Panel-tier adoption for exercise items is deferred to a future pass. Only the board stage container gets `panel-base`.

## Not In Scope

- Sheet surfaces (leaderboard, badges, shop rows) — Phase C
- Background/atmosphere changes — Phase A (shipped)
- Reward spectacle redesign — Phase D
- Exercise drawer item tier adoption — future pass
- New CTA gradients or color changes — existing CTA system is preserved
