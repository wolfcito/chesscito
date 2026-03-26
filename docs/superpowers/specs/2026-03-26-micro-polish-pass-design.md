# Micro-Polish Pass — Design Spec

**Date:** 2026-03-26
**Status:** Frozen
**Goal:** Two targeted micro-fixes to improve spacing and component clarity without architectural changes.

---

## 1. Trophy Vitrine Spacing

### Problem
The transition from header to first card is too tight. The section label and first card feel crammed against the header.

### Fix
- Add `pt-4` (16px) to the list zone container — gives 8px more breathing room after header border.
- Change section `<h2>` margin from `mb-2` to `mb-3` — gives 4px more between label and first card.

### Applies to
`apps/web/src/app/trophies/page.tsx` — list zone div and section h2 elements.

---

## 2. Arena Utility Cluster

### Problem
- The stars/progress chip (`h-5`, transparent bg, amber border at `/20`) reads more as plain text than as a badge/chip.
- The more button wrapper works but the chip next to it is too subtle.

### Fix: Progress Chip → Badge Treatment
The exercise drawer trigger button gets a more badge-like treatment:
- Height: `h-5` → `h-6` (24px)
- Background: `bg-transparent` → `bg-amber-400/8`
- Border: `border-amber-400/20` → `border-amber-400/25`
- Text: `text-amber-300/70` → `text-amber-300/80`
- Padding: `px-2` → `px-2.5`
- Star icon: `size={9}` → `size={10}`

This makes it read as a badge/chip rather than inline text.

### Applies to
`apps/web/src/components/play-hub/exercise-drawer.tsx` — SheetTrigger button.

---

## What This Spec Does NOT Change
- Surface system (frozen)
- Header Pattern B (frozen)
- Hero selector rail (just shipped)
- Any layout, architecture, or data flow
