# Phase 2 Visual Polish & Identity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase visual punch and product identity without changing layout architecture — hero polish, overlay differentiation, signature moments, about page alignment.

**Architecture:** CSS-only and className changes across existing components. One new CSS keyframe (`hero-plop`). Accent stripe system via className additions to 4 existing sheet headers. No new components, no new files.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-25-phase2-visual-polish-identity-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `apps/web/src/components/play-hub/mission-panel.tsx` | Modify | Hero icon size, glow, gradient bg, inactive scale, target size, plop animation, board vignette |
| `apps/web/src/app/globals.css` | Modify | Add `@keyframes hero-plop`, footer transition line class |
| `apps/web/src/components/play-hub/badge-sheet.tsx` | Modify | Accent stripe, title icon, owned badge inner glow + check badge |
| `apps/web/src/components/play-hub/shop-sheet.tsx` | Modify | Accent stripe, title icon, featured item ring + label |
| `apps/web/src/components/play-hub/exercise-drawer.tsx` | Modify | Accent stripe, title icon |
| `apps/web/src/components/play-hub/leaderboard-sheet.tsx` | Modify | Accent stripe, title icon |
| `apps/web/src/components/arena/arena-hud.tsx` | Modify | Back confirm: backdrop-blur + border opacity |
| `apps/web/src/components/legal-page-shell.tsx` | Modify | Background class, link styles |
| `apps/web/src/app/about/page.tsx` | Modify | Logo glow, title glow |

---

### Task 1: Hero Selector Visual Polish (HIGH PRIORITY)

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx:110-159`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Add hero-plop keyframe to globals.css**

Add this keyframe at the end of `globals.css`, before the closing of the file:

```css
@keyframes hero-plop {
  0% { transform: scale(0.95); }
  40% { transform: scale(1.03); }
  100% { transform: scale(1); }
}
```

- [ ] **Step 2: Update hero piece classNames in mission-panel.tsx**

In mission-panel.tsx, find the piece button className (around line 120-124). Replace the active branch:

From:
```tsx
? "h-16 w-16 border-2 border-cyan-400/45 bg-cyan-500/[0.12] shadow-[0_0_16px_rgba(34,211,238,0.20)]"
: "h-9 w-9 border border-white/[0.06] opacity-30 disabled:opacity-20"
```

To:
```tsx
? "h-16 w-16 border-2 border-cyan-300/60 bg-gradient-to-b from-cyan-400/15 to-cyan-600/8 shadow-[0_0_20px_rgba(34,211,238,0.30)]"
: "h-8 w-8 min-h-[44px] min-w-[44px] border border-white/[0.06] opacity-[0.22] disabled:opacity-20"
```

- [ ] **Step 3: Update hero icon and label sizes**

Find the icon span (around line 127):

From:
```tsx
<span className={isActive ? "text-2xl drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-lg"}>
```

To:
```tsx
<span className={isActive ? "text-3xl drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-lg"}>
```

Find the label span (around line 131):

From:
```tsx
<span className="text-[7px] font-bold uppercase tracking-[0.12em] text-cyan-200">
```

To:
```tsx
<span className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-cyan-100">
```

- [ ] **Step 4: Update target value size**

Find the target value `<p>` (around line 154):

From:
```tsx
<p className="text-lg font-extrabold text-cyan-400/90 drop-shadow-[0_0_12px_rgba(34,211,238,0.20)]">
```

To:
```tsx
<p className="text-xl font-black text-cyan-400/90 drop-shadow-[0_0_12px_rgba(34,211,238,0.20)]">
```

- [ ] **Step 5: Add plop animation on piece change**

Add `useRef` to the imports at the top of mission-panel.tsx:

From:
```tsx
import { useEffect, useState } from "react";
```

To:
```tsx
import { useEffect, useRef, useState } from "react";
```

Inside the `MissionPanel` function body (before the return), add:

```tsx
const prevPieceRef = useRef(selectedPiece);
const [plopping, setPlopping] = useState(false);

useEffect(() => {
  if (prevPieceRef.current !== selectedPiece) {
    prevPieceRef.current = selectedPiece;
    setPlopping(true);
    const timer = setTimeout(() => setPlopping(false), 300);
    return () => clearTimeout(timer);
  }
}, [selectedPiece]);
```

Then in the hero button className, append the plop animation when active and plopping. Find the active className string and append:

```tsx
? `h-16 w-16 border-2 border-cyan-300/60 bg-gradient-to-b from-cyan-400/15 to-cyan-600/8 shadow-[0_0_20px_rgba(34,211,238,0.30)] ${plopping ? "animate-[hero-plop_300ms_cubic-bezier(0.34,1.56,0.64,1)]" : ""}`
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx apps/web/src/app/globals.css
git commit -m "style: hero selector visual polish — larger icon, stronger glow, plop animation

Wolfcito 🐾 @akawolfcito"
```

---

### Task 2: Overlay Accent Stripes + Title Icons (HIGH PRIORITY)

**Files:**
- Modify: `apps/web/src/components/play-hub/exercise-drawer.tsx`
- Modify: `apps/web/src/components/play-hub/shop-sheet.tsx`
- Modify: `apps/web/src/components/play-hub/badge-sheet.tsx`
- Modify: `apps/web/src/components/play-hub/leaderboard-sheet.tsx`

All 4 sheets follow the same pattern: `<SheetContent>` → `<SheetHeader>` → `<SheetTitle>`. We add an accent stripe before the header and an icon inside the title.

- [ ] **Step 1: Exercise Drawer — accent stripe + icon**

In `exercise-drawer.tsx`, add `Crosshair` to the lucide import (it's already imported — verify, if not add it). Then find `<SheetContent>` block (around line 75):

After the opening `<SheetContent side="bottom" className="mission-shell rounded-t-3xl border-slate-700">` tag, add the stripe:

```tsx
<div className="h-0.5 w-full bg-gradient-to-r from-cyan-500/40 via-cyan-400/20 to-cyan-500/40" />
```

Then update the SheetTitle to include the icon. Find:

```tsx
<SheetTitle className="fantasy-title text-cyan-50">
  {EXERCISE_DRAWER_COPY.title}
</SheetTitle>
```

Replace with:

```tsx
<SheetTitle className="fantasy-title flex items-center gap-2 text-cyan-50">
  <Crosshair size={20} className="text-cyan-400/40" />
  {EXERCISE_DRAWER_COPY.title}
</SheetTitle>
```

Note: `Crosshair` is already in the lucide import of exercise-drawer.tsx — no import change needed.

Wait — check: exercise-drawer imports are `Lock, Swords, MoveRight, Star`. No `Crosshair`. Add it:

From:
```tsx
import { Lock, Swords, MoveRight, Star } from "lucide-react";
```

To:
```tsx
import { Crosshair, Lock, Swords, MoveRight, Star } from "lucide-react";
```

- [ ] **Step 2: Shop Sheet — accent stripe + icon**

In `shop-sheet.tsx`, add `ShoppingBag` to imports:

From:
```tsx
import { CheckCircle2, XCircle, CircleDashed } from "lucide-react";
```

To:
```tsx
import { CheckCircle2, XCircle, CircleDashed, ShoppingBag } from "lucide-react";
```

After `<SheetContent side="bottom" className="mission-shell sheet-bg-shop rounded-t-3xl border-slate-700">`, add:

```tsx
<div className="h-0.5 w-full bg-gradient-to-r from-amber-500/40 via-amber-400/20 to-amber-500/40" />
```

Update SheetTitle from:

```tsx
<SheetTitle className="fantasy-title text-cyan-50">{SHOP_SHEET_COPY.title}</SheetTitle>
```

To:

```tsx
<SheetTitle className="fantasy-title flex items-center gap-2 text-cyan-50">
  <ShoppingBag size={20} className="text-amber-400/40" />
  {SHOP_SHEET_COPY.title}
</SheetTitle>
```

- [ ] **Step 3: Badge Sheet — accent stripe + icon**

In `badge-sheet.tsx`, `Trophy` is already imported. After `<SheetContent side="bottom" className="mission-shell sheet-bg-badges rounded-t-3xl border-slate-700">`, add:

```tsx
<div className="h-0.5 w-full bg-gradient-to-r from-emerald-500/40 via-emerald-400/20 to-emerald-500/40" />
```

Update SheetTitle from:

```tsx
<SheetTitle className="fantasy-title text-cyan-50">{BADGE_SHEET_COPY.title}</SheetTitle>
```

To:

```tsx
<SheetTitle className="fantasy-title flex items-center gap-2 text-cyan-50">
  <Trophy size={20} className="text-emerald-400/40" />
  {BADGE_SHEET_COPY.title}
</SheetTitle>
```

- [ ] **Step 4: Leaderboard Sheet — accent stripe + icon**

In `leaderboard-sheet.tsx`, add `Crown` to imports. Find the lucide import line and add `Crown`:

```tsx
import { BadgeCheck, Crown } from "lucide-react";
```

After `<SheetContent side="bottom" className="mission-shell sheet-bg-leaderboard rounded-t-3xl border-slate-700">`, add:

```tsx
<div className="h-0.5 w-full bg-gradient-to-r from-purple-500/40 via-purple-400/20 to-purple-500/40" />
```

Update SheetTitle from:

```tsx
<SheetTitle className="fantasy-title text-cyan-50">{LEADERBOARD_SHEET_COPY.title}</SheetTitle>
```

To:

```tsx
<SheetTitle className="fantasy-title flex items-center gap-2 text-cyan-50">
  <Crown size={20} className="text-purple-400/40" />
  {LEADERBOARD_SHEET_COPY.title}
</SheetTitle>
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/play-hub/exercise-drawer.tsx apps/web/src/components/play-hub/shop-sheet.tsx apps/web/src/components/play-hub/badge-sheet.tsx apps/web/src/components/play-hub/leaderboard-sheet.tsx
git commit -m "style: overlay accent stripes + title icons for role differentiation

Wolfcito 🐾 @akawolfcito"
```

---

### Task 3: Featured Store Item (HIGH PRIORITY)

**Files:**
- Modify: `apps/web/src/components/play-hub/shop-sheet.tsx:55-82`

- [ ] **Step 1: Add featured ring + label to first premium item**

In shop-sheet.tsx, find the items map (around line 55). The first purchasable premium item is `itemId === 1n` (Founder Badge). Update the card wrapper:

From:
```tsx
{items.map((item) => (
  <div key={item.itemId.toString()} className="mission-soft rune-frame shop-slot-frame rounded-2xl p-3">
```

To:
```tsx
{items.map((item, index) => {
  const isFeatured = index === 0 && item.configured && item.enabled;
  return (
    <div key={item.itemId.toString()} className={`mission-soft rune-frame shop-slot-frame rounded-2xl p-3 relative ${isFeatured ? "ring-2 ring-amber-400/30" : ""}`}>
      {isFeatured && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-amber-400/25 bg-amber-500/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-amber-400/60">
          Featured
        </span>
      )}
```

And close the `return` with `);}` instead of just the closing `</div>` + `))`). Find the item's closing:

From:
```tsx
            </Button>
            </div>
          ))}
```

To:
```tsx
            </Button>
            </div>
          );
        })}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/play-hub/shop-sheet.tsx
git commit -m "style: featured store item with accent ring and label

Wolfcito 🐾 @akawolfcito"
```

---

### Task 4: Owned Badge State (HIGH PRIORITY)

**Files:**
- Modify: `apps/web/src/components/play-hub/badge-sheet.tsx:64-73`

- [ ] **Step 1: Enhance owned badge card**

In badge-sheet.tsx, find the BadgeCard component's container div className (around line 64-73). Update the `isClaimed` branch:

From:
```tsx
isClaimed
  ? "bg-emerald-500/10 ring-1 ring-emerald-500/20"
```

To:
```tsx
isClaimed
  ? "bg-emerald-500/10 ring-1 ring-emerald-500/20 shadow-[inset_0_0_16px_rgba(16,185,129,0.12)]"
```

- [ ] **Step 2: Add check badge to owned cards**

In the same BadgeCard component, find the container div's opening tag (around line 64). Add `relative` to the base className:

From:
```tsx
"flex items-center gap-3 rounded-2xl px-3 py-3 transition",
```

To:
```tsx
"relative flex items-center gap-3 rounded-2xl px-3 py-3 transition",
```

Then right after the opening `<div>` (after the className closing), add the check badge conditionally:

```tsx
{isClaimed && (
  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]">
    &#10003;
  </span>
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/play-hub/badge-sheet.tsx
git commit -m "style: owned badge inner glow + check badge for achievement feel

Wolfcito 🐾 @akawolfcito"
```

---

### Task 5: Board Vignette + Footer Transition (MEDIUM PRIORITY)

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx:173-181`

- [ ] **Step 1: Add vignette and rounded corners to board wrapper**

Find the board zone (around line 173-174):

From:
```tsx
<div className="min-h-0 flex-1 px-1 mt-2">
  {board}
```

To:
```tsx
<div className="min-h-0 flex-1 px-1 mt-2">
  <div className="h-full rounded-lg overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]">
    {board}
  </div>
```

And close the inner div before the replay label. Find:

```tsx
  {board}
  {isReplay && (
```

After the vignette wrapper, move the replay label outside:

```tsx
<div className="min-h-0 flex-1 px-1 mt-2">
  <div className="h-full rounded-lg overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]">
    {board}
  </div>
  {isReplay && (
    <p className="px-2 py-1 text-center text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-cyan-400/50">
      {PRACTICE_COPY.label}
    </p>
  )}
</div>
```

- [ ] **Step 2: Add footer transition line**

Between the board zone closing `</div>` and the footer opening, add:

```tsx
{/* Visual transition between board and footer */}
<div className="h-px bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "style: board vignette + rounded corners + footer transition line

Wolfcito 🐾 @akawolfcito"
```

---

### Task 6: Back to Hub Confirm Polish (MEDIUM PRIORITY)

**Files:**
- Modify: `apps/web/src/components/arena/arena-hud.tsx:72-77`

- [ ] **Step 1: Add backdrop-blur and stronger border to confirm state**

In arena-hud.tsx, find the back button confirming className (around line 75):

From:
```tsx
? "w-auto gap-1.5 border-white/20 bg-white/10 px-3 text-white"
```

To:
```tsx
? "w-auto gap-1.5 border-white/30 bg-white/10 backdrop-blur-sm px-3 text-white"
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/arena/arena-hud.tsx
git commit -m "style: back to hub confirm — backdrop blur + stronger border

Wolfcito 🐾 @akawolfcito"
```

---

### Task 7: About Page Polish (LOW PRIORITY)

**Files:**
- Modify: `apps/web/src/components/legal-page-shell.tsx:16`
- Modify: `apps/web/src/app/about/page.tsx:22-48`

- [ ] **Step 1: Update LegalPageShell background**

In legal-page-shell.tsx, find the container div (line 16):

From:
```tsx
<div className="flex min-h-[100dvh] justify-center bg-[#0b1220]">
```

To:
```tsx
<div className="mission-shell flex min-h-[100dvh] justify-center">
```

- [ ] **Step 2: Update About page logo and title glows**

In about/page.tsx, find the logo img (around line 28):

From:
```tsx
className="h-16 w-16 drop-shadow-[0_0_12px_rgba(103,232,249,0.4)]"
```

To:
```tsx
className="h-16 w-16 drop-shadow-[0_0_24px_rgba(103,232,249,0.15)]"
```

Find the title h2 (around line 31):

From:
```tsx
<h2 className="text-xl font-bold text-cyan-50">{ABOUT_COPY.title}</h2>
```

To:
```tsx
<h2 className="text-xl font-bold text-cyan-50 drop-shadow-[0_0_8px_rgba(103,232,249,0.2)]">{ABOUT_COPY.title}</h2>
```

- [ ] **Step 3: Update nav link styles**

Find the Link className (around line 43):

From:
```tsx
className="flex min-h-[44px] items-center gap-3 rounded-xl bg-cyan-950/40 px-4 py-3 text-cyan-100 transition hover:bg-cyan-950/60"
```

To:
```tsx
className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-cyan-100 transition hover:bg-white/[0.06]"
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/legal-page-shell.tsx apps/web/src/app/about/page.tsx
git commit -m "style: about page aligned to game universe — mission-shell bg, subtle glows

Wolfcito 🐾 @akawolfcito"
```

---

### Task 8: TypeScript Check + Visual QA

- [ ] **Step 1: Run TypeScript check**

Run: `cd apps/web && npx tsc --noEmit`

Expected: Clean output, no errors.

- [ ] **Step 2: Visual QA on 390px viewport**

Test all modified screens:
1. Play-hub: hero selector — piece is 30px icon, gradient bg, glow halo. Switch pieces: plop animation fires once.
2. Play-hub: target label — "e5" in text-xl font-black.
3. Play-hub: board has subtle vignette + rounded corners.
4. Play-hub: footer transition line barely visible between board and footer.
5. Exercise drawer: cyan accent stripe at top, Crosshair icon in title.
6. Shop sheet: amber accent stripe, ShoppingBag icon, first item has "Featured" label.
7. Badge sheet: emerald stripe, Trophy icon, owned badges have inner glow + check badge.
8. Leaderboard: purple stripe, Crown icon.
9. Arena: back button in confirm state has backdrop blur.
10. About page: mission-shell background, glowing title, rounded nav links.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: visual QA adjustments from Phase 2 review

Wolfcito 🐾 @akawolfcito"
```
