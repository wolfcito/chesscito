# Surface System Correction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the frozen 3-tier surface system to all screens, restoring presence and legibility without redesigning architecture.

**Architecture:** CSS custom properties define the surface tiers in `globals.css`. Each component gets updated to use the correct tier. Header Pattern B is applied to all sheets. The sheet overlay primitive gets a stronger scrim.

**Tech Stack:** Tailwind CSS, CSS custom properties, Next.js React components

**Spec:** `docs/superpowers/specs/2026-03-25-surface-system-correction-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/src/app/globals.css` | Modify | Add surface tier CSS variables, update sheet overlay, footer, dock |
| `apps/web/src/components/ui/sheet.tsx` | Modify | Strengthen overlay scrim to `bg-black/60` |
| `apps/web/src/components/legal-page-shell.tsx` | Modify | Surface A + Header Pattern B |
| `apps/web/src/app/about/page.tsx` | Modify | Reinforce link items with Surface A fills |
| `apps/web/src/app/trophies/page.tsx` | Modify | Surface A full panel + Header Pattern B |
| `apps/web/src/components/trophies/trophy-card.tsx` | Modify | Reinforce card backgrounds |
| `apps/web/src/components/play-hub/leaderboard-sheet.tsx` | Modify | Header Pattern B |
| `apps/web/src/components/play-hub/shop-sheet.tsx` | Modify | Header Pattern B + featured card reinforcement |
| `apps/web/src/components/play-hub/badge-sheet.tsx` | Modify | Header Pattern B + badge row reinforcement |
| `apps/web/src/components/play-hub/exercise-drawer.tsx` | Modify | Surface B + Header Pattern B + exercise card reinforcement |
| `apps/web/src/components/arena/arena-hud.tsx` | Modify | Surface C-mid on buttons |
| `apps/web/src/components/arena/difficulty-selector.tsx` | Modify | Surface B+ (0.90) |

---

### Task 1: CSS Foundation — Surface Tier Variables + Sheet Overlay + Footer/Dock

**Files:**
- Modify: `apps/web/src/app/globals.css:37-39` (add variables)
- Modify: `apps/web/src/app/globals.css:206-214` (sheet overlay opacity)
- Modify: `apps/web/src/app/globals.css:533-596` (footer + dock)
- Modify: `apps/web/src/components/ui/sheet.tsx:22` (overlay scrim)

- [ ] **Step 1: Add surface tier CSS variables to `:root`**

In `globals.css`, after line 39 (`--overlay-scrim`), add the new surface variables:

```css
    --surface-a: rgba(6, 14, 28, 0.95);
    --surface-b: rgba(6, 14, 28, 0.82);
    --surface-b-plus: rgba(6, 14, 28, 0.90);
    --surface-c-light: rgba(6, 14, 28, 0.55);
    --surface-c-mid: rgba(6, 14, 28, 0.60);
    --surface-c-heavy: rgba(6, 14, 28, 0.65);
    --header-zone-bg: rgba(255, 255, 255, 0.08);
    --header-zone-border: rgba(255, 255, 255, 0.08);
```

- [ ] **Step 2: Update sheet background overlay from 0.58 to Surface B**

In `globals.css`, change the `sheet-bg-*::after` rule (line 212):

```css
  /* Before */
  background: rgba(10, 20, 25, 0.58);
  /* After */
  background: var(--surface-b);
```

- [ ] **Step 3: Update footer to Surface C-heavy**

In `globals.css`, change `.chesscito-footer` (line 533-537):

```css
  .chesscito-footer {
    background: var(--surface-c-heavy);
    border-top: 1px solid rgba(160, 205, 225, 0.10);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
```

- [ ] **Step 4: Update dock border**

In `globals.css`, change `.chesscito-dock` border-top (line 545):

```css
    border-top: 1px solid rgba(160, 205, 225, 0.10);
```

- [ ] **Step 5: Update dock items — opacity and backgrounds**

In `globals.css`, change `.chesscito-dock-item > button` (lines 555-565):

```css
  .chesscito-dock-item > button,
  .chesscito-dock-item > [role="button"] {
    width: 2.75rem !important;
    height: 2.75rem !important;
    border-radius: 14px !important;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.10);
    opacity: 0.45;
    transition: opacity 0.15s, background 200ms, border-color 200ms;
  }
```

- [ ] **Step 6: Update dock items active state**

In `globals.css`, change the `:active` rule (lines 567-572):

```css
  .chesscito-dock-item > button:active,
  .chesscito-dock-item > [role="button"]:active {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(160, 205, 225, 0.20);
    opacity: 0.65;
  }
```

- [ ] **Step 7: Strengthen sheet overlay scrim in UI primitive**

In `apps/web/src/components/ui/sheet.tsx`, change `bg-black/50` to `bg-black/60` (line 22):

```tsx
      "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
```

- [ ] **Step 8: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/components/ui/sheet.tsx
git commit -m "style: surface system foundation — CSS variables, sheet overlay, footer/dock reinforcement"
```

---

### Task 2: About Page — Surface A + Header Pattern B

**Files:**
- Modify: `apps/web/src/components/legal-page-shell.tsx:16-33`
- Modify: `apps/web/src/app/about/page.tsx:43`

- [ ] **Step 1: Apply Surface A + Header Pattern B to LegalPageShell**

Replace the full component body in `legal-page-shell.tsx` (lines 15-34):

```tsx
    <div className="mission-shell flex min-h-[100dvh] justify-center bg-black/50">
      <div className="flex w-full max-w-[var(--app-max-width)] flex-col rounded-t-3xl bg-[var(--surface-a)] backdrop-blur-2xl">
        <header className="flex items-center gap-3 border-b border-[var(--header-zone-border)] bg-[var(--header-zone-bg)] px-5 py-5 rounded-t-3xl">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.10] text-cyan-200/80 transition hover:text-cyan-50"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        </header>
        <div className="flex-1 space-y-6 px-5 pb-8 pt-6 text-sm leading-relaxed text-cyan-100/80">
          {children}
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Reinforce About page link items**

In `about/page.tsx`, change the link className (line 43):

```tsx
            className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.06] px-4 py-3 text-cyan-100 transition hover:bg-white/[0.10]"
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/legal-page-shell.tsx apps/web/src/app/about/page.tsx
git commit -m "style: about page — Surface A panel with Header Pattern B"
```

---

### Task 3: Trophy Vitrine — Surface A + Header Pattern B

**Files:**
- Modify: `apps/web/src/app/trophies/page.tsx:92-112`
- Modify: `apps/web/src/components/trophies/trophy-card.tsx:72`

- [ ] **Step 1: Apply Surface A to Trophy Vitrine container**

In `trophies/page.tsx`, replace the outer div (line 92):

```tsx
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[var(--app-max-width)] flex-col bg-[var(--surface-a)] backdrop-blur-2xl">
```

- [ ] **Step 2: Apply Header Pattern B to hero zone**

In `trophies/page.tsx`, replace the hero zone (lines 94-112):

```tsx
      <header className="relative flex min-h-40 max-h-[200px] items-end border-b border-[var(--header-zone-border)] bg-[var(--header-zone-bg)] px-4 pb-5 pt-6 rounded-t-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2a3f] to-transparent opacity-40 rounded-t-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.10]"
          >
            <ArrowLeft className="h-4 w-4 text-slate-300" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              {TROPHY_VITRINE_COPY.pageTitle}
            </h1>
            <p className="text-xs text-slate-400">
              {TROPHY_VITRINE_COPY.pageDescription}
            </p>
          </div>
        </div>
      </header>
```

- [ ] **Step 3: Reinforce trophy card backgrounds**

In `trophy-card.tsx`, change the card container (line 72):

```tsx
        "rounded-xl border bg-[#121c2f] px-3 py-2.5 shadow-sm",
```

No change needed — `bg-[#121c2f]` is already opaque. But reinforce rank accent borders. Change `RANK_ACCENT` (lines 14-18):

```tsx
const RANK_ACCENT: Record<number, string> = {
  1: "border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.12)]",
  2: "border-slate-300/40 shadow-[0_0_10px_rgba(203,213,225,0.12)]",
  3: "border-orange-600/40 shadow-[0_0_10px_rgba(234,88,12,0.12)]",
};
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/trophies/page.tsx apps/web/src/components/trophies/trophy-card.tsx
git commit -m "style: trophy vitrine — Surface A panel with Header Pattern B, reinforced cards"
```

---

### Task 4: Hall of Rooks (Leaderboard Sheet) — Surface B + Header Pattern B

**Files:**
- Modify: `apps/web/src/components/play-hub/leaderboard-sheet.tsx:57-62`

- [ ] **Step 1: Apply Header Pattern B to leaderboard sheet**

In `leaderboard-sheet.tsx`, replace lines 57-62:

```tsx
      <SheetContent side="bottom" className="mission-shell sheet-bg-leaderboard rounded-t-3xl border-white/[0.10]">
        <div className="flex items-center justify-between border-b border-[var(--header-zone-border)] bg-[var(--header-zone-bg)] -mx-6 -mt-6 rounded-t-3xl px-6 py-5">
          <SheetHeader className="flex-1">
            <SheetTitle className="fantasy-title flex items-center gap-2 text-slate-100"><Crown size={20} className="text-purple-400/60" />{LEADERBOARD_SHEET_COPY.title}</SheetTitle>
            <SheetDescription className="text-cyan-100/75">{LEADERBOARD_SHEET_COPY.description}</SheetDescription>
          </SheetHeader>
        </div>
```

Remove the old gradient divider line (`<div className="h-0.5 w-full bg-gradient-to-r from-purple-500/40 via-purple-400/20 to-purple-500/40" />`).

- [ ] **Step 2: Reinforce leaderboard row backgrounds**

In `leaderboard-sheet.tsx`, update the row className (line 94). Change:

```tsx
            <div key={row.rank} className="mission-soft rune-frame grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-3 py-2">
```

to:

```tsx
            <div key={row.rank} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/leaderboard-sheet.tsx
git commit -m "style: hall of rooks — Surface B sheet with Header Pattern B"
```

---

### Task 5: Store Sheet — Surface B + Header Pattern B + Featured Reinforcement

**Files:**
- Modify: `apps/web/src/components/play-hub/shop-sheet.tsx:46-51,59-64`

- [ ] **Step 1: Apply Header Pattern B to store sheet**

In `shop-sheet.tsx`, replace lines 46-51:

```tsx
      <SheetContent side="bottom" className="mission-shell sheet-bg-shop rounded-t-3xl border-white/[0.10]">
        <div className="flex items-center justify-between border-b border-[var(--header-zone-border)] bg-[var(--header-zone-bg)] -mx-6 -mt-6 rounded-t-3xl px-6 py-5">
          <SheetHeader className="flex-1">
            <SheetTitle className="fantasy-title flex items-center gap-2 text-slate-100"><ShoppingBag size={20} className="text-amber-400/60" />{SHOP_SHEET_COPY.title}</SheetTitle>
            <SheetDescription className="text-cyan-100/75">{SHOP_SHEET_COPY.description}</SheetDescription>
          </SheetHeader>
        </div>
```

Remove the old gradient divider line.

- [ ] **Step 2: Reinforce featured card (inner card override)**

In `shop-sheet.tsx`, update the item card className (line 59). Change:

```tsx
            <div key={item.itemId.toString()} className={`mission-soft rune-frame shop-slot-frame rounded-2xl p-3 relative ${isFeatured ? "ring-2 ring-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.08)]" : "opacity-80"}`}>
```

to:

```tsx
            <div key={item.itemId.toString()} className={`rounded-2xl border p-3 relative ${isFeatured ? "border-amber-400/40 bg-[rgba(6,14,28,0.90)] ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]" : "border-white/[0.08] bg-white/[0.04] opacity-90"}`}>
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/shop-sheet.tsx
git commit -m "style: store — Surface B sheet, Header Pattern B, featured card hero override"
```

---

### Task 6: Badges Sheet — Surface B + Header Pattern B + Row Reinforcement

**Files:**
- Modify: `apps/web/src/components/play-hub/badge-sheet.tsx:202-207,66-73`

- [ ] **Step 1: Apply Header Pattern B to badge sheet**

In `badge-sheet.tsx`, replace lines 202-207:

```tsx
      <SheetContent side="bottom" className="mission-shell sheet-bg-badges rounded-t-3xl border-white/[0.10]">
        <div className="flex items-center justify-between border-b border-[var(--header-zone-border)] bg-[var(--header-zone-bg)] -mx-6 -mt-6 rounded-t-3xl px-6 py-5">
          <SheetHeader className="flex-1">
            <SheetTitle className="fantasy-title flex items-center gap-2 text-slate-100"><Trophy size={20} className="text-emerald-400/60" />{BADGE_SHEET_COPY.title}</SheetTitle>
            <SheetDescription className="text-cyan-100/75">{BADGE_SHEET_COPY.subtitle}</SheetDescription>
          </SheetHeader>
        </div>
```

Remove the old gradient divider line.

- [ ] **Step 2: Reinforce badge card backgrounds (inner card override for owned)**

In `badge-sheet.tsx`, update the BadgeCard className (lines 66-73). Change:

```tsx
        isClaimed
          ? "bg-emerald-500/12 ring-1 ring-emerald-500/20 shadow-[inset_0_0_16px_rgba(16,185,129,0.12)]"
          : isClaimable
            ? "bg-cyan-500/10 ring-1 ring-cyan-400/30"
            : "bg-slate-800/20",
```

to:

```tsx
        isClaimed
          ? "bg-emerald-500/15 ring-1 ring-emerald-500/25 shadow-[inset_0_0_20px_rgba(16,185,129,0.15)]"
          : isClaimable
            ? "bg-cyan-500/12 ring-1 ring-cyan-400/35 shadow-[inset_0_0_12px_rgba(34,211,238,0.06)]"
            : "bg-white/[0.04] border border-white/[0.06]",
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/badge-sheet.tsx
git commit -m "style: badges — Surface B sheet, Header Pattern B, reinforced owned/locked states"
```

---

### Task 7: Exercise Drawer — Surface B + Header Pattern B + Card Reinforcement

**Files:**
- Modify: `apps/web/src/components/play-hub/exercise-drawer.tsx:75-82,97-104`

- [ ] **Step 1: Apply Surface B + Header Pattern B to exercise drawer**

In `exercise-drawer.tsx`, replace lines 75-82:

```tsx
      <SheetContent side="bottom" className="mission-shell rounded-t-3xl border-white/[0.10]" style={{ background: "var(--surface-b)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between border-b border-[var(--header-zone-border)] bg-[var(--header-zone-bg)] -mx-6 -mt-6 rounded-t-3xl px-6 py-5">
          <SheetHeader className="flex-1">
            <SheetTitle className="fantasy-title flex items-center gap-2 text-slate-100"><Crosshair size={20} className="text-cyan-400/60" />{EXERCISE_DRAWER_COPY.title}</SheetTitle>
            <SheetDescription className="text-cyan-100/75">
              {PIECE_LABELS[piece]}
            </SheetDescription>
          </SheetHeader>
        </div>
```

Remove the old gradient divider line.

- [ ] **Step 2: Reinforce exercise card backgrounds**

In `exercise-drawer.tsx`, update the exercise button className (lines 97-104). Change:

```tsx
                  isActive
                    ? "bg-cyan-500/15 ring-1 ring-cyan-400/40"
                    : isDone
                      ? "bg-slate-800/40 hover:bg-slate-800/60"
                      : "bg-slate-800/20",
```

to:

```tsx
                  isActive
                    ? "bg-cyan-500/18 ring-1 ring-cyan-400/45 shadow-[inset_0_0_12px_rgba(34,211,238,0.06)]"
                    : isDone
                      ? "bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08]"
                      : "bg-white/[0.03] border border-white/[0.04]",
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/exercise-drawer.tsx
git commit -m "style: exercises — Surface B sheet, Header Pattern B, reinforced exercise cards"
```

---

### Task 8: Arena HUD Buttons — Surface C-mid

**Files:**
- Modify: `apps/web/src/components/arena/arena-hud.tsx:73-77,110-113`

- [ ] **Step 1: Update back button to Surface C-mid**

In `arena-hud.tsx`, update the back button normal state (lines 75-76). Change:

```tsx
            ? "w-auto gap-1.5 border-white/30 bg-white/10 backdrop-blur-sm px-3 text-white"
            : "w-11 border-white/10 bg-white/5 text-white/70 hover:text-white",
```

to:

```tsx
            ? "w-auto gap-1.5 border-white/30 bg-white/12 backdrop-blur-md px-3 text-white"
            : "w-11 border-white/[0.12] bg-[var(--surface-c-mid)] backdrop-blur-md text-white/80 hover:text-white",
```

- [ ] **Step 2: Update resign button to Surface C-mid**

In `arena-hud.tsx`, update the resign button normal state (lines 112-113). Change:

```tsx
                ? "w-auto gap-1.5 border-rose-400/40 bg-rose-500/15 px-3 text-rose-400"
                : "w-11 border-white/10 bg-white/5 text-white/35 hover:text-rose-400",
```

to:

```tsx
                ? "w-auto gap-1.5 border-rose-400/40 bg-rose-500/18 backdrop-blur-md px-3 text-rose-400"
                : "w-11 border-white/[0.12] bg-[var(--surface-c-mid)] backdrop-blur-md text-white/50 hover:text-rose-400",
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/arena/arena-hud.tsx
git commit -m "style: arena HUD — Surface C-mid on back/resign buttons"
```

---

### Task 9: Arena Difficulty Selector — Surface B+

**Files:**
- Modify: `apps/web/src/components/arena/difficulty-selector.tsx:24`

- [ ] **Step 1: Update difficulty panel to Surface B+**

In `difficulty-selector.tsx`, change the panel className (line 24):

```tsx
      <div className="w-full max-w-[320px] rounded-3xl border border-white/[0.08] bg-[var(--surface-b-plus)] px-6 pb-6 pt-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(20,184,166,0.08)]">
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/arena/difficulty-selector.tsx
git commit -m "style: arena difficulty — Surface B+ (0.90)"
```

---

### Task 10: Visual QA Checklist

No code changes. Manual verification on device.

- [ ] **Step 1: Run dev server**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web dev`

- [ ] **Step 2: QA checklist (browser + MiniPay)**

Verify each screen against the spec:

| Screen | Check | Pass? |
|--------|-------|-------|
| About | Surface A (0.95), Header Pattern B, back button tactile, links reinforced | |
| Trophy Vitrine | Surface A (0.95), Header Pattern B, cards solid, rank borders visible | |
| Hall of Rooks | Surface B (0.82), Header Pattern B, rows with bg, scrim `black/60` | |
| Store | Surface B (0.82), Header Pattern B, featured hero card, non-featured visible | |
| Badges | Surface B (0.82), Header Pattern B, owned glow, locked readable | |
| Exercises | Surface B (0.82), Header Pattern B, active card pops, done cards solid | |
| Arena HUD | C-mid buttons, back/resign visible, confirm states intact | |
| Footer + Dock | C-heavy (0.65), items opacity 0.45, borders visible, center glow intact | |
| Arena Difficulty | B+ (0.90), options readable, scrim `black/70` | |

- [ ] **Step 3: Header Pattern B validation across all sheets**

For each sheet, confirm:
- Header zone bg is visible as differentiated mass (not invisible)
- Title is `slate-100` (full white), readable in < 1 second
- Close button (X) has visible bg + border, reads as tactile
- Header connects to body (no hard visual cut)

- [ ] **Step 4: Anti-regression check**

Confirm no text-heavy screen uses Surface C. All content screens use A or B.

- [ ] **Step 5: Document any needed fallback adjustments**

If Header Pattern B `white/8` feels too heavy on device, note which screens to adjust to `white/6` fallback.
