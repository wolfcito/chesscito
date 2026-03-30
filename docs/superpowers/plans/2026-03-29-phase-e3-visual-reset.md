# Phase E3 — Visual Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Play Hub from polished web-app aesthetic to premium mobile game product via surface material reset, display typography, reward ceremony, and hero background.

**Architecture:** CSS-first surface overhaul in `globals.css` (panel tokens, dock, piece rail), Fredoka One font via `next/font/google` in `layout.tsx`, staged reward animations in `result-overlay.tsx`, and 1 AI-generated hero background. No new components — only restyling existing ones.

**Tech Stack:** Next.js 14, Tailwind CSS, next/font (Google Fonts), CSS keyframes, Lottie (existing infrastructure)

**Spec:** `docs/superpowers/specs/2026-03-29-phase-e3-visual-reset-design.md`

---

## File Map

| File | Role | Tasks |
|------|------|-------|
| `apps/web/src/app/layout.tsx` | Font import (Fredoka One) | 1 |
| `apps/web/src/app/globals.css` | Surface tokens, panel classes, dock, piece rail, text-shadow system, reward keyframes | 2, 3, 4, 5, 6, 7, 8 |
| `apps/web/src/components/play-hub/contextual-action-slot.tsx` | CTA button restyling | 4 |
| `apps/web/src/components/play-hub/mission-panel.tsx` | Phase flash enhancement, piece rail label font | 5, 8 |
| `apps/web/src/components/play-hub/gameplay-panel.tsx` | Panel font for key labels | 5 |
| `apps/web/src/components/play-hub/persistent-dock.tsx` | Dock label font | 5, 8 |
| `apps/web/src/components/play-hub/result-overlay.tsx` | Reward ceremony v1 (staged reveal) | 6, 7 |
| `apps/web/src/components/arena/arena-end-state.tsx` | Victory/defeat text treatment | 8 |
| `apps/web/src/components/arena/victory-celebration.tsx` | Victory title treatment | 8 |
| `apps/web/public/art/` | Hero background asset | 9 |

---

### Task 1: Import Fredoka One via next/font

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Add Fredoka One import and CSS variable**

In `apps/web/src/app/layout.tsx`, add the font import and apply the CSS variable to `<html>`:

```tsx
import type { Metadata, Viewport } from 'next';
import { Fredoka } from 'next/font/google';
import './globals.css';

import { WalletProvider } from "@/components/wallet-provider"

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-fredoka',
  display: 'swap',
});
```

Then on the `<html>` tag, add the variable class:

```tsx
<html lang="en" className={`dark ${fredoka.variable}`} suppressHydrationWarning>
```

- [ ] **Step 2: Verify font loads**

Run: `cd apps/web && npx next dev`

Open http://localhost:3000 in browser at 390px viewport. Open DevTools → Elements → `<html>`. Confirm `--font-fredoka` CSS variable is present in computed styles. The font won't be visually applied yet (no elements use it).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/layout.tsx
git commit -m "feat(e3): import Fredoka One display font via next/font"
```

---

### Task 2: Surface Material Reset — Design Tokens

**Files:**
- Modify: `apps/web/src/app/globals.css` (`:root` section, lines ~6-98)

- [ ] **Step 1: Add new surface tokens and text-shadow system to `:root`**

Add these new tokens inside the existing `:root` block, after the existing `--treat-*` tokens (after line ~65):

```css
  /* ── E3 Surface Material tokens ── */
  --panel-bg-base: linear-gradient(
    180deg,
    hsl(220, 40%, 12%) 0%,
    hsl(220, 45%, 8%) 100%
  );
  --panel-bg-elevated: linear-gradient(
    180deg,
    hsl(220, 38%, 14%) 0%,
    hsl(222, 42%, 9%) 100%
  );
  --panel-bg-showcase: linear-gradient(
    180deg,
    hsl(218, 36%, 16%) 0%,
    hsl(222, 44%, 10%) 100%
  );
  --panel-border-base: 2px solid rgba(255, 255, 255, 0.08);
  --panel-shadow-base:
    0 2px 6px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  --panel-shadow-elevated:
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35);
  --panel-shadow-showcase:
    0 6px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4);

  /* ── E3 Text Shadow system ── */
  --text-shadow-hero: 0 0 24px rgba(34, 211, 238, 0.4), 0 2px 0 rgba(0, 0, 0, 0.8);
  --text-shadow-display: 0 0 12px rgba(34, 211, 238, 0.25), 0 1px 0 rgba(0, 0, 0, 0.6);
  --text-shadow-label: 0 1px 2px rgba(0, 0, 0, 0.5);
  --text-shadow-hero-amber: 0 0 24px rgba(217, 180, 74, 0.4), 0 2px 0 rgba(0, 0, 0, 0.8);
  --text-shadow-hero-rose: 0 0 24px rgba(251, 113, 133, 0.4), 0 2px 0 rgba(0, 0, 0, 0.8);
  --text-shadow-hero-emerald: 0 0 24px rgba(52, 211, 153, 0.4), 0 2px 0 rgba(0, 0, 0, 0.8);

  /* ── E3 Display Font ── */
  --font-game-display: var(--font-fredoka), "Fredoka One", sans-serif;
```

- [ ] **Step 2: Verify tokens parse**

Run: `cd apps/web && npx next dev`

Open DevTools → Elements → `:root`. Confirm all new `--panel-*` and `--text-shadow-*` variables appear. No visual change expected yet — tokens are defined but not consumed.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(e3): add surface material and text-shadow design tokens"
```

---

### Task 3: Surface Material Reset — Panel Classes

**Files:**
- Modify: `apps/web/src/app/globals.css` (panel classes, lines ~617-670)

- [ ] **Step 1: Replace `.panel-base`**

Find the existing `.panel-base` block (line ~617) and replace it:

```css
.panel-base {
  background: var(--panel-bg-base);
  border: var(--panel-border-base);
  border-radius: var(--shell-radius);
  box-shadow: var(--panel-shadow-base);
}
```

- [ ] **Step 2: Replace `.panel-elevated`**

Find the existing `.panel-elevated` block (line ~624) and replace it (including the `::after` pseudo-element):

```css
.panel-elevated {
  position: relative;
  background: var(--panel-bg-elevated);
  border: 2px solid rgba(255, 255, 255, 0.10);
  border-radius: var(--shell-radius);
  box-shadow: var(--panel-shadow-elevated);
}

.panel-elevated::after {
  content: "";
  position: absolute;
  top: 0;
  left: 2px;
  right: 2px;
  height: 1px;
  background: rgba(255, 255, 255, 0.10);
  pointer-events: none;
  z-index: 2;
  border-radius: var(--shell-radius) var(--shell-radius) 0 0;
}
```

- [ ] **Step 3: Replace `.panel-showcase`**

Find the existing `.panel-showcase` block (line ~648) and replace it (including the `::after` pseudo-element):

```css
.panel-showcase {
  position: relative;
  background: var(--panel-bg-showcase);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--shell-radius);
  box-shadow: var(--panel-shadow-showcase);
}

.panel-showcase::after {
  content: "";
  position: absolute;
  top: 0;
  left: 2px;
  right: 2px;
  height: 1px;
  background: rgba(255, 255, 255, 0.14);
  pointer-events: none;
  z-index: 2;
  border-radius: var(--shell-radius) var(--shell-radius) 0 0;
}
```

- [ ] **Step 4: Verify panels at 390px**

Run dev server. Open Play Hub at 390px. Verify:
- Board wrapper (`.panel-base`) has solid gradient background, no transparency/blur
- Gameplay panel (`.panel-elevated`) has visible bevel — brighter top edge, darker bottom
- Result overlay panel (`.panel-showcase`) has thickest border and deepest shadow
- All panels feel opaque and solid, not glassy

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style(e3): surface material reset — panel classes"
```

---

### Task 4: Surface Material Reset — CTA Buttons

**Files:**
- Modify: `apps/web/src/components/play-hub/contextual-action-slot.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Add game-cta button class to globals.css**

Add after the panel classes section:

```css
/* ── E3 CTA Button depth ── */
.game-cta-depth {
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -2px 0 rgba(0, 0, 0, 0.25);
  transition: all 120ms ease-out;
  font-family: var(--font-game-display);
  text-shadow: var(--text-shadow-label);
}

.game-cta-depth:active {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  transform: translateY(1px) scale(0.97);
}
```

- [ ] **Step 2: Apply depth class to CTA button**

In `apps/web/src/components/play-hub/contextual-action-slot.tsx`, update the button's className. Find the `<button>` element (line ~86) and add `game-cta-depth` to the class list. Replace the existing shadow and active classes:

Change the className from:
```
flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold uppercase tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] transition-all active:scale-[0.97] active:shadow-none active:brightness-90 disabled:opacity-70 ${style.bg} ${style.glow} ${style.text} ${action === "retry" ? "border border-[rgba(190,210,255,0.08)]" : ""}
```

To:
```
game-cta-depth flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold uppercase tracking-wide disabled:opacity-70 ${style.bg} ${style.glow} ${style.text} ${action === "retry" ? "border border-[rgba(190,210,255,0.08)]" : ""}
```

The `game-cta-depth` class handles shadow, active state, font, and text-shadow — so the inline `shadow-[...]`, `active:scale-[0.97]`, `active:shadow-none`, `active:brightness-90`, and `transition-all` are removed.

- [ ] **Step 3: Verify CTA at 390px**

Run dev server. Open Play Hub. Navigate to a state where a CTA button is visible (e.g., "Submit Score"). Verify:
- Button has visible 3D depth (raised appearance)
- Pressing the button gives a "push into surface" feel (translateY + shadow collapse)
- Text uses Fredoka One font
- Text has subtle outline shadow for readability

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/components/play-hub/contextual-action-slot.tsx
git commit -m "style(e3): CTA button depth treatment"
```

---

### Task 5: Surface Material Reset — Dock & Piece Rail

**Files:**
- Modify: `apps/web/src/app/globals.css` (dock lines ~820-910, hero rail lines ~1028-1137)

- [ ] **Step 1: Replace `.chesscito-dock`**

Find the existing `.chesscito-dock` block (line ~820) and replace:

```css
.chesscito-dock {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 6px 8px 4px;
  border-top: 2px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(
    180deg,
    hsl(220, 42%, 11%) 0%,
    hsl(222, 48%, 7%) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 -4px 12px rgba(0, 0, 0, 0.3);
}
```

- [ ] **Step 2: Update `.chesscito-dock-item` buttons**

Find the existing `.chesscito-dock-item > button` rule (line ~838) and replace:

```css
.chesscito-dock-item > button,
.chesscito-dock-item > [role="button"] {
  width: 2.75rem !important;
  height: 2.75rem !important;
  border-radius: 14px !important;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  opacity: 0.65;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: opacity 0.15s, background 200ms, border-color 200ms, transform 120ms;
}

.chesscito-dock-item > button:active,
.chesscito-dock-item > [role="button"]:active {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(160, 205, 225, 0.20);
  opacity: 0.65;
  transform: scale(0.92) translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform 120ms, opacity 120ms, background 120ms;
}
```

- [ ] **Step 3: Update `.chesscito-dock-center`**

Find the existing `.chesscito-dock-center` block (line ~865) and replace:

```css
.chesscito-dock-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  overflow: hidden;
  width: 3.5rem;
  height: 3rem;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: rgba(160, 225, 220, 0.55);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: all 200ms;
  font-family: var(--font-game-display);
}

.chesscito-dock-center.is-active {
  background: rgba(20, 184, 166, 0.15);
  border-color: rgba(20, 184, 166, 0.30);
  color: rgba(160, 225, 220, 0.8);
  box-shadow:
    0 0 16px rgba(20, 184, 166, 0.14),
    0 2px 6px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(20, 184, 166, 0.12);
  transform: scale(1.04);
}
```

Leave `.chesscito-dock-center:not(.is-active)`, `.chesscito-dock-center.is-active svg`, and `.chesscito-dock-center:active` rules unchanged.

- [ ] **Step 4: Update `.hero-rail`**

Find the existing `.hero-rail` block (line ~1028) and replace:

```css
.hero-rail {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 60px;
  background: linear-gradient(
    180deg,
    hsl(220, 40%, 13%) 0%,
    hsl(222, 45%, 8%) 100%
  );
  border: 2px solid rgba(160, 140, 100, 0.18);
  border-radius: 36px;
  padding: 4px 5px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35);
}
```

- [ ] **Step 5: Add game font to key game labels**

Add a utility class for game labels to globals.css, after the `.game-cta-depth` rules:

```css
/* ── E3 Key game labels ── */
.game-label {
  font-family: var(--font-game-display);
  text-shadow: var(--text-shadow-label);
}
```

This class will be applied in Task 8 to specific label elements in the components.

- [ ] **Step 6: Update `.hero-rail-tab` active/inactive states**

Find `.hero-rail-tab.is-active` (line ~1055) and replace:

```css
.hero-rail-tab.is-active {
  background: linear-gradient(
    180deg,
    hsl(220, 35%, 16%) 0%,
    hsl(222, 40%, 10%) 100%
  );
  border-color: rgba(180, 160, 110, 0.45);
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -2px 4px rgba(0, 0, 0, 0.4),
    0 0 14px rgba(200, 170, 100, 0.18);
  transform: scale(1.05);
}
```

Find `.hero-rail-tab.is-inactive` (line ~1093) and replace:

```css
.hero-rail-tab.is-inactive {
  opacity: 0.45;
  border-color: rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}
```

Leave `.hero-rail-tab.is-locked` unchanged.

- [ ] **Step 7: Verify dock and piece rail at 390px**

Run dev server. Open Play Hub at 390px. Verify:
- Dock feels like a solid architectural bar (not a floating transparent strip)
- Dock top border is thick and visible
- Dock items have subtle 3D depth
- Dock center "FREE PLAY" button has depth + teal glow when active
- Piece rail has solid gradient background (not transparent)
- Active piece tab is visibly raised with depth shadow
- Inactive tabs feel like recessed slots

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style(e3): surface material reset — dock and piece rail"
```

---

### Task 6: Display Typography — .fantasy-title & Text Shadow System

**Files:**
- Modify: `apps/web/src/app/globals.css` (`.fantasy-title` at line ~171)

- [ ] **Step 1: Replace `.fantasy-title`**

Find the existing `.fantasy-title` block (line ~171) and replace:

```css
.fantasy-title {
  font-family: var(--font-game-display);
  letter-spacing: 0.01em;
  text-shadow: var(--text-shadow-display);
}
```

- [ ] **Step 2: Verify titles at 390px**

Run dev server. Open Play Hub at 390px. Verify:
- "chesscito" branding text uses Fredoka One
- Any `.fantasy-title` text renders in the rounded bold game font
- Text has visible shadow (glow + outline) for depth
- Open result overlay (complete an exercise) — title should use Fredoka One

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style(e3): display typography — fantasy-title to Fredoka One"
```

---

### Task 7: Reward Ceremony v1 — Staged Result Reveal

**Files:**
- Modify: `apps/web/src/app/globals.css` (add new keyframes)
- Modify: `apps/web/src/components/play-hub/result-overlay.tsx`

- [ ] **Step 1: Add reward ceremony keyframes to globals.css**

Add after the existing reward animation section (after `@keyframes glow-pulse-once`):

```css
/* ── E3 Reward Ceremony v1 ── */
@keyframes reward-panel-enter {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes reward-star-bounce {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  60% {
    opacity: 1;
    transform: scale(1.25);
  }
  80% {
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes reward-star-glow {
  0% {
    box-shadow: 0 0 0 rgba(217, 180, 74, 0);
  }
  50% {
    box-shadow: 0 0 12px rgba(217, 180, 74, 0.5);
  }
  100% {
    box-shadow: 0 0 0 rgba(217, 180, 74, 0);
  }
}

@keyframes reward-icon-enter {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes reward-buttons-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes reward-confetti-burst {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  30% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reward-ceremony-panel,
  .reward-ceremony-icon,
  .reward-ceremony-star,
  .reward-ceremony-buttons,
  .reward-ceremony-confetti {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- [ ] **Step 2: Update `ResultOverlay` with staged reveal**

In `apps/web/src/components/play-hub/result-overlay.tsx`, replace the inner panel div of the `ResultOverlay` component.

Change line 196 from:
```tsx
      <div className={`${isError ? "panel-elevated" : "panel-showcase"} flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center animate-in zoom-in-95 fade-in duration-350`}>
```

To:
```tsx
      <div
        className={`${isError ? "panel-elevated" : "panel-showcase"} reward-ceremony-panel flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center`}
        style={{ animation: "reward-panel-enter 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
```

- [ ] **Step 3: Update `SuccessImage` with staged icon entrance**

Replace the `SuccessImage` component (lines 64-75):

```tsx
function SuccessImage({ variant, pieceType, glowClass }: { variant: SuccessVariant; pieceType?: PieceKey; glowClass?: string }) {
  const src = variant === "badge" ? getBadgeImg(pieceType) : VARIANT_IMG[variant];
  return (
    <div className={`relative flex items-center justify-center ${glowClass ?? "reward-glow-progress"}`}>
      <picture
        className="reward-icon-showcase reward-ceremony-icon relative z-10"
        style={{ animation: "reward-icon-enter 250ms ease-out 200ms both" }}
      >
        <source srcSet={src.replace(".png", ".avif")} type="image/avif" />
        <source srcSet={src.replace(".png", ".webp")} type="image/webp" />
        <img src={src} alt="" className="h-32 w-32 object-contain drop-shadow-lg" />
      </picture>
    </div>
  );
}
```

- [ ] **Step 4: Update `StarsRow` with bounce animation**

Replace the `StarsRow` component (lines 80-115):

```tsx
function StarsRow({ totalStars, staggered = false }: { totalStars: number; staggered?: boolean }) {
  const filled = Math.min(EXERCISES_PER_PIECE, Math.ceil(totalStars / 3));
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: EXERCISES_PER_PIECE }, (_, i) => {
        const isEarned = i < filled;
        const starDelay = 400 + i * 150; // Phase B starts at 400ms, stagger 150ms
        return (
          <span
            key={i}
            className={
              isEarned
                ? "reward-ceremony-star text-amber-400 inline-block"
                : "text-amber-400/30"
            }
            style={
              isEarned && staggered
                ? {
                    opacity: 0,
                    animation: `reward-star-bounce 350ms cubic-bezier(0.34, 1.56, 0.64, 1) ${starDelay}ms forwards`,
                  }
                : undefined
            }
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
      <span
        className="reward-ceremony-buttons ml-1 text-xs text-cyan-100/70"
        style={staggered ? { opacity: 0, animation: "reward-buttons-enter 250ms ease-out 1200ms forwards" } : undefined}
      >
        {totalStars}/{MAX_STARS}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Add staged entrance to CTA buttons in ResultOverlay**

Find the CTA buttons wrapper div (line 241):

Change from:
```tsx
        <div className="mt-2 flex w-full flex-col gap-2">
```

To:
```tsx
        <div
          className="reward-ceremony-buttons mt-2 flex w-full flex-col gap-2"
          style={{ opacity: 0, animation: "reward-buttons-enter 300ms ease-out 1300ms forwards" }}
        >
```

- [ ] **Step 6: Apply same staged entrance to BadgeEarnedPrompt**

In the `BadgeEarnedPrompt` component (line 320), update the panel div:

Change from:
```tsx
      <div className="panel-showcase flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center animate-in zoom-in-95 fade-in duration-350">
```

To:
```tsx
      <div
        className="panel-showcase reward-ceremony-panel flex w-full max-w-xs flex-col items-center gap-6 px-6 py-10 text-center"
        style={{ animation: "reward-panel-enter 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
```

And update the buttons div (line 327):

Change from:
```tsx
        <div className="mt-2 flex w-full flex-col gap-2">
```

To:
```tsx
        <div
          className="reward-ceremony-buttons mt-2 flex w-full flex-col gap-2"
          style={{ opacity: 0, animation: "reward-buttons-enter 300ms ease-out 1300ms forwards" }}
        >
```

- [ ] **Step 7: Verify reward ceremony at 390px**

Run dev server. Complete an exercise in Play Hub. Verify:
- Panel slides up smoothly (not instant pop)
- Reward icon fades in with scale after panel lands
- Stars appear one by one with bounce (not all at once)
- Score count and buttons fade in after stars
- Total sequence feels like ~2 seconds
- Error overlay still works (no ceremony, just standard appear)

Also verify `prefers-reduced-motion`: in DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`. Verify everything appears instantly.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/components/play-hub/result-overlay.tsx
git commit -m "feat(e3): reward ceremony v1 — staged result reveal"
```

---

### Task 8: Display Typography — Victory Text, Phase Flash & Key Labels

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx` (PhaseFlash + piece rail labels)
- Modify: `apps/web/src/components/arena/victory-celebration.tsx` (victory title)
- Modify: `apps/web/src/components/arena/arena-end-state.tsx` (defeat title)
- Modify: `apps/web/src/app/globals.css` (victory slam keyframe)

- [ ] **Step 1: Add victory text slam keyframe to globals.css**

Add after the reward ceremony keyframes:

```css
/* ── E3 Victory text slam ── */
@keyframes victory-text-slam {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  70% {
    opacity: 1;
    transform: scale(1.06);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .victory-text-slam {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- [ ] **Step 2: Update PhaseFlash with game font + dramatic entry**

In `apps/web/src/components/play-hub/mission-panel.tsx`, find the PhaseFlash text span (line 88):

Change from:
```tsx
        <span className={`fantasy-title text-3xl drop-shadow-lg ${flash.accent}`}>
          {flash.text}
        </span>
```

To:
```tsx
        <span
          className={`fantasy-title text-3xl ${flash.accent}`}
          style={{
            textShadow: phase === "success" ? "var(--text-shadow-hero-emerald)" : "var(--text-shadow-hero-rose)",
            animation: "victory-text-slam 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          {flash.text}
        </span>
```

- [ ] **Step 3: Update piece rail active label with game font**

In `apps/web/src/components/play-hub/mission-panel.tsx`, find the active piece label (line 211):

Change from:
```tsx
                  {isActive && (
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[rgba(220,200,150,0.9)]">
                      {piece.label}
                    </span>
                  )}
```

To:
```tsx
                  {isActive && (
                    <span
                      className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[rgba(220,200,150,0.9)]"
                      style={{ fontFamily: "var(--font-game-display)", textShadow: "var(--text-shadow-label)" }}
                    >
                      {piece.label}
                    </span>
                  )}
```

- [ ] **Step 4: Apply game-label class to stats and mission labels**

In `apps/web/src/components/play-hub/mission-panel.tsx`, find the "MISSION" label (line 145):

Change from:
```tsx
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-400/85">
```

To:
```tsx
        <p className="game-label text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-400/85">
```

Find the score stat span (line 129):

Change from:
```tsx
        <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-white/85">
```

To:
```tsx
        <span className="game-label flex items-center gap-1 text-xs font-bold tabular-nums text-white/85">
```

Find the timer stat span (line 134):

Change from:
```tsx
        <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-white/85">
```

To:
```tsx
        <span className="game-label flex items-center gap-1 text-xs font-bold tabular-nums text-white/85">
```

In `apps/web/src/components/play-hub/persistent-dock.tsx`, find the "FREE PLAY" label (line 37):

Change from:
```tsx
        <span className="text-[7px] font-bold uppercase tracking-[0.12em]">
```

To:
```tsx
        <span className="game-label text-[7px] font-bold uppercase tracking-[0.12em]">
```

- [ ] **Step 5: Update victory celebration title**

In `apps/web/src/components/arena/victory-celebration.tsx`, find the title h2 (line 63):

Change from:
```tsx
        <h2 className="fantasy-title mb-1 text-3xl font-bold text-emerald-300/90 drop-shadow-[0_0_12px_rgba(20,184,166,0.35)]">
```

To:
```tsx
        <h2
          className="fantasy-title victory-text-slam mb-1 text-3xl font-bold text-emerald-300/90"
          style={{
            textShadow: "var(--text-shadow-hero-emerald)",
            animation: "victory-text-slam 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
```

- [ ] **Step 6: Update defeat title in arena-end-state**

In `apps/web/src/components/arena/arena-end-state.tsx`, find the defeat title h2 (line 132):

Change from:
```tsx
        <h2 className="fantasy-title text-2xl font-bold text-rose-300 drop-shadow-[0_0_16px_rgba(251,113,133,0.4)]">
```

To:
```tsx
        <h2
          className="fantasy-title text-2xl font-bold text-rose-300"
          style={{ textShadow: "var(--text-shadow-hero-rose)" }}
        >
```

- [ ] **Step 7: Update defeat panel to use surface material**

In `apps/web/src/components/arena/arena-end-state.tsx`, find the defeat panel div (line 122):

Change from:
```tsx
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/[0.08] bg-[var(--surface-frosted)] px-8 py-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(251,113,133,0.08)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
```

To:
```tsx
      <div className="panel-showcase flex flex-col items-center gap-6 px-8 py-8 shadow-[0_0_60px_rgba(251,113,133,0.08)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
```

This removes the `backdrop-blur-2xl`, `bg-[var(--surface-frosted)]`, inline border, and inline rounded — all now inherited from `.panel-showcase`.

- [ ] **Step 8: Update victory celebration panel to use surface material**

In `apps/web/src/components/arena/victory-celebration.tsx`, find the card panel div (line 51):

Change from:
```tsx
      <div className="relative z-10 mx-4 flex w-full max-w-[340px] flex-col items-center rounded-3xl border border-white/[0.08] bg-[var(--surface-frosted)] px-6 pb-6 pt-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(20,184,166,0.08)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
```

To:
```tsx
      <div className="panel-showcase relative z-10 mx-4 flex w-full max-w-[340px] flex-col items-center px-6 pb-6 pt-8 shadow-[0_0_60px_rgba(20,184,166,0.08)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
```

- [ ] **Step 9: Verify at 390px**

Run dev server. Verify:
- Play Hub: "MISSION" label, score, and timer use Fredoka One with shadow
- Play Hub: complete an exercise → "Well done!" flashes with game font + scale bounce + emerald glow shadow
- Piece rail: active piece name uses Fredoka One
- Dock: "FREE PLAY" label uses Fredoka One
- Arena: win a game → "Victory!" title slams in with scale bounce + emerald glow
- Arena: lose a game → defeat title has rose glow shadow, panel is solid `.panel-showcase` (no blur)
- Victory celebration card is solid (no frosted glass)

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/components/play-hub/mission-panel.tsx apps/web/src/components/play-hub/persistent-dock.tsx apps/web/src/components/arena/victory-celebration.tsx apps/web/src/components/arena/arena-end-state.tsx
git commit -m "style(e3): display typography — victory slam, phase flash, key labels"
```

---

### Task 9: Hero Background (Non-Blocking)

**Files:**
- Replace: `apps/web/public/art/bg-chesscitov3.png`, `bg-chesscitov3.webp`, `bg-chesscitov3.avif`
- Modify: `apps/web/src/app/globals.css` (atmosphere overlay values)

- [ ] **Step 1: Generate hero background**

Use an AI image generation tool (Midjourney, DALL-E, or similar) with this prompt:

```
Fantasy medieval chess sanctuary at night, warm candlelight and
soft magical glow, stone architecture with arched elements,
deep navy blue and warm amber tones, painterly digital art style,
atmospheric depth with subtle fog, vertical mobile game background
9:19.5 aspect ratio, no characters, no text, no UI elements,
background should feel rich but not busy, slightly out of focus
for depth of field, dark mood with warm light pools
```

Generate 3-5 candidates. Select the one that:
- Has the best depth (foreground/midground/background separation)
- Has warm light sources without being too bright
- Won't compete with UI elements for attention
- Feels like a "place" (not abstract)

- [ ] **Step 2: Post-process the selected background**

Process the image:
1. Crop to mobile vertical (9:19.5 aspect ratio, 1170×2532px)
2. Color-grade: ensure deep navy dominates, amber is limited to light sources, no oversaturation
3. Darken overall by ~10-15% if too bright — the background must be subordinate
4. Apply subtle gaussian blur (1-2px) if too sharp/detailed

Export:
- `bg-chesscitov3.png` (full quality, fallback)
- `bg-chesscitov3.webp` (quality 80, target <300KB)
- `bg-chesscitov3.avif` (quality 60, target <200KB)

Place all three in `apps/web/public/art/`, replacing the existing files.

- [ ] **Step 3: Recalibrate atmosphere overlays**

In `apps/web/src/app/globals.css`, the atmosphere overlays may need adjustment for the new background. Check the Play Hub at 390px and tune these values if needed.

Find `.atmosphere::before` (line ~563). The current values may need adjustment:

```css
.atmosphere::before {
  /* ... existing structure ... */
  background: radial-gradient(
    ellipse at 50% 40%,
    transparent 50%,
    rgba(0, 0, 0, 0.45) 100%  /* may need 0.40-0.50 range */
  );
}
```

Find `.atmosphere::after` (line ~575). Current values:

```css
.atmosphere::after {
  /* ... existing structure ... */
  background:
    linear-gradient(to bottom, transparent 0%, rgba(6, 14, 28, 0.20) 55%, rgba(6, 14, 28, 0.35) 100%),
    linear-gradient(to bottom, transparent 70%, rgba(6, 14, 28, 0.35) 100%);
  /* may need opacity adjustment based on new bg luminance */
}
```

Adjust values until:
- Board area is clearly the brightest/most visible zone
- Edges darken naturally (vignette)
- Bottom of screen (dock area) is dark enough for text legibility

- [ ] **Step 4: Verify composition at 390px**

Run dev server. Open Play Hub at 390px. Verify:
- Background creates sense of place and atmosphere
- Board is still the focal point (background is subordinate)
- All text remains legible over the new background
- Dock bar reads clearly against the bottom of the background
- The overall composition feels like a scene, not a screen

If the background doesn't meet quality bar: revert to the original `bg-chesscitov3` files and skip this task. The rest of E3 P0 is complete without it.

- [ ] **Step 5: Commit**

```bash
git add apps/web/public/art/bg-chesscitov3.png apps/web/public/art/bg-chesscitov3.webp apps/web/public/art/bg-chesscitov3.avif
git add apps/web/src/app/globals.css  # only if atmosphere was recalibrated
git commit -m "style(e3): hero background for Play Hub world building"
```

---

### Task 10: Final Verification Pass

**Files:** None (read-only verification)

- [ ] **Step 1: Full Play Hub walkthrough at 390px**

Run dev server. Open Play Hub at 390px viewport. Walk through:

1. **App open**: Piece rail has solid material tabs. Background provides atmosphere. Dock is a solid bar.
2. **Select a piece**: Active tab raises with depth shadow. Label uses game font.
3. **Play an exercise**: Board wrapper is solid panel. Gameplay panel has bevel. CTA button has 3D depth.
4. **Complete exercise (success)**: Phase flash has game font + slam animation. Result overlay slides up with staged reveal. Stars bounce in one by one. Buttons fade in last.
5. **Complete exercise (failure)**: Phase flash shows "Try again" with rose glow.
6. **Result overlay dismiss**: Panel exits cleanly.

- [ ] **Step 2: Arena victory walkthrough**

Navigate to Arena. Win a game (Easy difficulty recommended). Verify:
- Victory celebration panel uses `.panel-showcase` (solid, no blur)
- "Victory!" title slams in with scale bounce + emerald glow
- All buttons are accessible

- [ ] **Step 3: Arena defeat walkthrough**

Lose a game in Arena. Verify:
- Defeat panel uses `.panel-showcase` (solid, no frosted glass)
- Defeat text has rose glow shadow
- Buttons work correctly

- [ ] **Step 4: prefers-reduced-motion verification**

In DevTools → Rendering → Emulate CSS media feature → `prefers-reduced-motion: reduce`. Repeat the exercise completion flow. Verify:
- No animations play — everything appears instantly
- All content is visible and functional
- No flashes or motion

- [ ] **Step 5: Screenshot before/after**

Take screenshots at 390px of:
- Play Hub (with piece selected)
- Result overlay (after exercise)
- Arena victory screen

Compare against pre-E3 screenshots. The before/after should read as a **language change**, not a refinement.

- [ ] **Step 6: Commit any final adjustments**

If any values needed tuning during verification:

```bash
git add -u
git commit -m "style(e3): final visual tuning from verification pass"
```

---

## Success Criteria Checklist

After all tasks are complete, verify against the spec's success criteria:

- [ ] Before/after reads as a change in visual language, not a refinement
- [ ] First-time viewer identifies the app as a game
- [ ] Panels feel like physical objects with weight and depth
- [ ] CTA buttons communicate pressability with 3D depth
- [ ] Dock reads as a solid architectural element
- [ ] Piece rail tabs feel like slots in a surface
- [ ] Titles and key labels read as game typography
- [ ] Display/body font contrast feels intentional
- [ ] Exercise completion feels like an event
- [ ] Star reveal has rhythm (staggered, bounced)
- [ ] Victory text hits with impact
- [ ] Background provides atmosphere (if shipped)
- [ ] Mobile-first: verified at 390px
- [ ] prefers-reduced-motion: all animations collapse to instant
- [ ] Touch targets remain 44px+
- [ ] No backdrop-blur on game surfaces
