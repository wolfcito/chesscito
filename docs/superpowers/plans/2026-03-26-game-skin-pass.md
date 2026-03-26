# Game Skin Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate Chesscito from "premium sober product" to "premium game with tactility and memorable components" without breaking the frozen surface system.

**Architecture:** Pure CSS/JSX styling changes. Hero selector gets a rail container with fixed-size tabs. Top actions get larger hit areas. Trophy header shrinks. Sheet close gets subtle treatment. Store hierarchy sharpens. No logic, API, or data flow changes.

**Tech Stack:** Tailwind CSS, CSS custom properties, Next.js React components

**Spec:** `docs/superpowers/specs/2026-03-26-game-skin-pass-design.md`

---

## Operational Guardrails

1. **Hero selector layout:** Fix width AND alignment of the entire hero block (rail + target zone) to prevent micro-shifts. Use explicit `w-full` and `max-w` on the container, centered with `mx-auto`.
2. **Motion safety:** If any transition causes flicker or layout thrash on device, remove the motion FIRST before adjusting tokens. Motion is a bonus, not a requirement.
3. **Store secondary:** Validate that opacity 0.75 remains usable in real QA. If it looks disabled on device, raise to 0.80 as fallback.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/src/components/play-hub/mission-panel.tsx` | Modify | Hero selector rail + top actions |
| `apps/web/src/app/globals.css` | Modify | Rail CSS class + hero-plop animation update |
| `apps/web/src/app/trophies/page.tsx` | Modify | Compact header |
| `apps/web/src/components/ui/sheet.tsx` | Modify | Subtle close button |
| `apps/web/src/components/play-hub/shop-sheet.tsx` | Modify | Featured/secondary hierarchy |

---

### Task 1: Hero Selector — Rail Container + Fixed Layout

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx:118-172`
- Modify: `apps/web/src/app/globals.css` (add `.hero-rail` class, update `@keyframes hero-plop`)

- [ ] **Step 1: Add hero-rail CSS class to globals.css**

In `globals.css`, after the `@keyframes hero-plop` block (around line 687), add the new rail class. Also update the hero-plop keyframes:

Replace the existing `@keyframes hero-plop` block:
```css
@keyframes hero-plop {
  0% { transform: scale(0.95); }
  40% { transform: scale(1.03); }
  100% { transform: scale(1); }
}
```

with:

```css
@keyframes hero-plop {
  0% { transform: scale(0.95); }
  40% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

/* ── Hero selector rail ── */
.hero-rail {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 60px;
  background: var(--surface-c-heavy);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 36px;
  padding: 4px 5px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.hero-rail-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 52px;
  border-radius: 28px;
  border: 1.5px solid transparent;
  background: transparent;
  cursor: pointer;
  position: relative;
  transition: opacity 150ms ease-out, border-color 150ms ease-out, background 150ms ease-out, box-shadow 150ms ease-out;
}

.hero-rail-tab.is-active {
  background: linear-gradient(180deg, rgba(34, 211, 238, 0.22) 0%, rgba(6, 14, 28, 0.80) 100%);
  border-color: rgba(103, 232, 249, 0.50);
  box-shadow: 0 0 14px rgba(34, 211, 238, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.hero-rail-tab.is-inactive {
  opacity: 0.50;
  border-color: rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
}

.hero-rail-tab.is-inactive:active {
  opacity: 0.70;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.10);
}
```

- [ ] **Step 2: Replace hero selector JSX in mission-panel.tsx**

Replace lines 119-172 (Zone A) with the new rail-based hero selector:

```tsx
      {/* Zone A: Hero Selector — rail + mission target, fixed layout */}
      <div className="shrink-0 w-full px-4 pt-[max(env(safe-area-inset-top),12px)]">
        {/* Piece selector rail — fixed 60px height */}
        <div className="flex justify-center">
          <div className="hero-rail">
            {pieces.map((piece) => {
              const isActive = selectedPiece === piece.key;
              const icon = PIECE_ICONS[piece.key as keyof typeof PIECE_ICONS];
              return (
                <button
                  key={piece.key}
                  type="button"
                  disabled={!piece.enabled}
                  onClick={() => onSelectPiece(piece.key)}
                  className={`hero-rail-tab ${isActive ? "is-active" : "is-inactive"}`}
                  aria-label={piece.label}
                >
                  <span
                    className={
                      isActive
                        ? `text-[26px] leading-none drop-shadow-[0_0_6px_rgba(34,211,238,0.5)] ${plopping ? "animate-[hero-plop_300ms_cubic-bezier(0.34,1.56,0.64,1)]" : ""}`
                        : "text-[20px] leading-none"
                    }
                  >
                    {icon}
                  </span>
                  {isActive && (
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-white">
                      {piece.label}
                    </span>
                  )}
                  {!piece.enabled && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/10 bg-slate-600/80 text-[7px]">
                      &#128274;
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mission label slot — fixed 48px height */}
        <div className="mt-3 h-12 text-center">
          {pieceHint ? (
            <p className="text-[11px] font-medium text-cyan-200/50">{pieceHint}</p>
          ) : (
            <>
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-cyan-400/25">
                Move to
              </p>
              <p className="text-xl font-black text-cyan-400/90 drop-shadow-[0_0_12px_rgba(34,211,238,0.20)]">
                {targetLabel}
              </p>
            </>
          )}
        </div>
      </div>
```

Key changes:
- Outer div gets `w-full` for fixed width alignment.
- Rail container (`hero-rail` class) replaces individual sized buttons.
- All tabs are `68px x 52px` — no size change on selection.
- Mission label slot gets `h-12` (48px) fixed height.
- Plop animation only on the icon `<span>`, not on the button container.
- `transition-all` replaced by specific property transitions in CSS class.

- [ ] **Step 3: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx apps/web/src/app/globals.css
git commit -m "$(cat <<'EOF'
style: hero selector — compact rail with fixed layout, zero reflow

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 2: Top Actions — Affordance Upgrade

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx:174-183`

- [ ] **Step 1: Upgrade utility band with larger, visible buttons**

Replace lines 174-183 (Zone A2) with:

```tsx
      {/* Zone A2: Utility Band — Lv + stars + more */}
      <div className="flex shrink-0 items-center justify-between px-4 h-8">
        <span className="text-[11px] font-bold text-purple-400/50">
          Lv {level}
        </span>
        <div className="flex items-center gap-2">
          {exerciseDrawer}
          {moreAction && (
            <div className="[&>button]:flex [&>button]:h-10 [&>button]:w-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-white/[0.10] [&>button]:bg-white/[0.06] [&>button]:text-white/55 [&>button]:transition-all [&>button]:active:scale-95 [&>button]:active:bg-white/[0.12]">
              {moreAction}
            </div>
          )}
        </div>
      </div>
```

Key changes:
- Height from `h-7` to `h-8` (32px) for more breathing room.
- Gap between items from `gap-1.5` to `gap-2`.
- The `moreAction` slot gets wrapper styles via Tailwind child selectors: `h-10 w-10` (40px), rounded-full, `bg-white/[0.06]`, `border-white/[0.10]`, `text-white/55`, with `active:scale-95 active:bg-white/[0.12]` pressed state.

Note: The `moreAction` is a ReactNode passed in from the parent. The child selector approach (`[&>button]`) styles whatever button the parent renders inside the slot, without requiring changes to the parent component.

- [ ] **Step 2: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "$(cat <<'EOF'
style: top actions — 40px hit area, visible surface, pressed state

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 3: Trophy Vitrine Header — Compact Ceremonial

**Files:**
- Modify: `apps/web/src/app/trophies/page.tsx:95`

- [ ] **Step 1: Reduce trophy header height**

In `trophies/page.tsx`, line 95, the header currently is:

```tsx
      <header className="relative flex min-h-40 max-h-[200px] items-end border-b border-[var(--header-zone-border)] bg-[var(--header-zone-bg)] px-4 pb-5 pt-6 rounded-t-3xl">
```

Change to:

```tsx
      <header className="relative flex min-h-[96px] max-h-[120px] items-end border-b border-[var(--header-zone-border)] bg-[var(--header-zone-bg)] px-4 pb-4 pt-4 rounded-t-3xl">
```

Changes:
- `min-h-40` (160px) → `min-h-[96px]`
- `max-h-[200px]` → `max-h-[120px]`
- `pb-5` → `pb-4`
- `pt-6` → `pt-4`

Also change the gradient overlay opacity on line 96:

```tsx
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2a3f] to-transparent opacity-35 rounded-t-3xl" />
```

Change `opacity-40` to `opacity-35`.

- [ ] **Step 2: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/trophies/page.tsx
git commit -m "$(cat <<'EOF'
style: trophy vitrine — compact header 96-120px, ceremonial tone preserved

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 4: Sheet Close Button — Subtle Tactile

**Files:**
- Modify: `apps/web/src/components/ui/sheet.tsx:66`

- [ ] **Step 1: Update SheetPrimitive.Close to subtle tactile treatment**

In `sheet.tsx`, line 66, the close button currently is:

```tsx
      <SheetPrimitive.Close className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.10] text-white/70 transition-opacity hover:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
```

Change to:

```tsx
      <SheetPrimitive.Close className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-white/45 transition-all hover:bg-white/[0.10] hover:text-white/65 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
```

Changes:
- `h-11 w-11` (44px) → `h-10 w-10` (40px)
- `border-white/[0.12]` → `border-white/[0.08]`
- `bg-white/[0.10]` → `bg-white/[0.05]`
- `text-white/70` → `text-white/45`
- `transition-opacity` → `transition-all`
- Added `hover:bg-white/[0.10] hover:text-white/65`

- [ ] **Step 2: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/sheet.tsx
git commit -m "$(cat <<'EOF'
style: sheet close — subtle tactile, 40px, micro-surface, non-competitive

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 5: Store Hierarchy — Featured Dominance

**Files:**
- Modify: `apps/web/src/components/play-hub/shop-sheet.tsx:60-67`

- [ ] **Step 1: Reinforce featured, dim secondary**

In `shop-sheet.tsx`, line 60, the item card currently is:

```tsx
            <div key={item.itemId.toString()} className={`rounded-2xl border p-3 relative ${isFeatured ? "border-amber-400/40 bg-[rgba(6,14,28,0.90)] ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]" : "border-white/[0.08] bg-white/[0.04] opacity-90"}`}>
```

Change to:

```tsx
            <div key={item.itemId.toString()} className={`rounded-2xl border p-3 relative ${isFeatured ? "border-amber-400/50 bg-[rgba(6,14,28,0.92)] ring-2 ring-amber-400/50 shadow-[0_0_24px_rgba(245,158,11,0.15),inset_0_0_16px_rgba(245,158,11,0.04)]" : "border-white/[0.05] bg-white/[0.02] opacity-75"}`}>
```

Changes for featured:
- `border-amber-400/40` → `border-amber-400/50`
- `bg-[rgba(6,14,28,0.90)]` → `bg-[rgba(6,14,28,0.92)]`
- `ring-amber-400/40` → `ring-amber-400/50`
- shadow: added inset glow `inset_0_0_16px_rgba(245,158,11,0.04)`, outer raised to `0.15`

Changes for secondary:
- `border-white/[0.08]` → `border-white/[0.05]`
- `bg-white/[0.04]` → `bg-white/[0.02]`
- `opacity-90` → `opacity-75`

- [ ] **Step 2: Reinforce featured tag**

In `shop-sheet.tsx`, line 62, the featured tag currently is:

```tsx
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-amber-400/35 bg-amber-500/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-amber-400/60">
```

Change to:

```tsx
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-amber-400/45 bg-amber-500/25 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-amber-400/80">
```

Changes:
- `border-amber-400/35` → `border-amber-400/45`
- `bg-amber-500/20` → `bg-amber-500/25`
- `text-amber-400/60` → `text-amber-400/80`

- [ ] **Step 3: Dim secondary text colors**

In `shop-sheet.tsx`, line 66-67, the item text currently is:

```tsx
              <p className="text-sm font-semibold text-slate-100">{item.label}</p>
              <p className="text-xs text-slate-400">{item.subtitle}</p>
```

Wrap these in a conditional for secondary items. Change to:

```tsx
              <p className={`text-sm font-semibold ${isFeatured ? "text-slate-100" : "text-slate-300"}`}>{item.label}</p>
              <p className={`text-xs ${isFeatured ? "text-slate-400" : "text-slate-500"}`}>{item.subtitle}</p>
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/play-hub/shop-sheet.tsx
git commit -m "$(cat <<'EOF'
style: store — featured dominance reinforced, secondary dimmed to 0.75

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 6: Visual QA Checklist

No code changes. Manual verification on device.

- [ ] **Step 1: Run dev server**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web dev`

- [ ] **Step 2: Hero selector QA**

| Check | Pass? |
|-------|-------|
| Rail renders at fixed 60px height | |
| Switching rook → bishop → knight causes ZERO layout reflow | |
| Board does not flicker or shift on piece change | |
| Inactive tabs are clearly visible and touchable at 0.50 opacity | |
| Active tab glow + border transitions smoothly (150ms) | |
| Plop animation fires on icon only, not on container | |
| Lock icon visible on disabled pieces | |
| Target zone stays at fixed 48px height regardless of content | |

**Motion guardrail:** If ANY transition causes flicker or layout thrash, remove the transition and use instant state change. Fix motion later.

- [ ] **Step 3: Top actions QA**

| Check | Pass? |
|-------|-------|
| More button is 40px, visible surface, clear icon | |
| More button is NOT visually weaker than back | |
| Pressed state (scale 0.95) works on both | |

- [ ] **Step 4: Trophy Vitrine header QA**

| Check | Pass? |
|-------|-------|
| Header height ~96-120px (not 160px) | |
| Ceremonial tone preserved (gradient, title size) | |
| List content appears sooner in viewport | |

- [ ] **Step 5: Sheet close QA**

| Check | Pass? |
|-------|-------|
| Close button is 40px with subtle micro-surface | |
| Does NOT compete with sheet title | |
| Hover state visibly increases contrast | |
| Consistent across Store, Badges, Hall, Exercises | |

- [ ] **Step 6: Store hierarchy QA**

| Check | Pass? |
|-------|-------|
| Featured card clearly dominates (amber glow, inset, strong tag) | |
| Secondary at 0.75 opacity is still readable and usable | |
| Secondary does NOT look disabled | |

**Store guardrail:** If secondary looks disabled on device at 0.75, raise to 0.80 as fallback.
