# Captura con Torres — Design

**Goal:** Introduce capture mechanics by replacing rook exercises 4-5 with capture variants. Enemy presence is signaled via a warm-tinted target indicator and editorial copy, not a literal enemy sprite.

---

## Exercise Changes

- Exercises 1-3: unchanged (move-to-target, teach basic rook movement)
- Exercise 4: capture variant — 2-move exercise with `isCapture: true`, warm/red target indicator
- Exercise 5: capture variant — same idea, different position

## Data Model

Add optional `isCapture?: boolean` to the `Exercise` type. When true:
- Target indicator uses `.playhub-board-target-capture` (warm red/amber tint)
- Stats bar TARGET label shows "CAPTURE" instead of the square label
- All other logic (scoring, validation, success/failure) unchanged

## Visual

- `.playhub-board-target-capture` — same size/position/animation as `.playhub-board-target` but with CSS `filter: hue-rotate(...) saturate(...)` to shift from cyan to warm red
- Reuses existing `target-circle` asset, no new art

## Editorial

- Add capture-related copy to editorial.ts
- Tutorial banner on first capture exercise: "Capture the target — move your Rook to its square"

## Scope

- Only rook exercises 4-5 change
- No new art assets
- No changes to scoring, progression, or badge logic
- Same 5-exercise / 15-star structure

## Files to Modify

- `apps/web/src/lib/game/types.ts` — add `isCapture?: boolean` to Exercise
- `apps/web/src/lib/game/exercises.ts` — mark rook exercises 4-5 with `isCapture: true`
- `apps/web/src/app/globals.css` — add `.playhub-board-target-capture`
- `apps/web/src/components/board.tsx` — use capture target class when applicable
- `apps/web/src/components/play-hub/mission-panel.tsx` — show "CAPTURE" in stats bar
- `apps/web/src/app/play-hub/page.tsx` — pass `isCapture` through to board and panel
- `apps/web/src/lib/content/editorial.ts` — add capture copy
