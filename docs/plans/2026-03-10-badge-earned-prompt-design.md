# Badge Earned Prompt — Design Doc

**Date:** 2026-03-10
**Problem:** Users complete all exercises but never get prompted to claim their badge or submit their score. The auto-advance closes the claim window in 1.5s, and the action bar buttons give no visual signal when unlocked.

## Fix D: Badge Earned Modal

When `badgeEarned` transitions from `false` to `true` during gameplay, intercept the auto-advance and show a fullscreen modal (reusing ResultOverlay styling).

### Layout

```
Fullscreen backdrop (dark)
  reward-glow (pulsing, behind image)
  Piece image (rook/bishop/knight)
  Stars row: ★★★★☆ 12/15
  Title: "{Piece} Ascendant Earned" (fantasy-title)
  [Claim Badge] button → calls handleClaimBadge()
  [Submit Score] button → calls handleSubmitScore()
  [Later] text button → dismisses, resumes auto-advance
  Branding: chesscito · on Celo
```

### Mechanics

- `useEffect` in `page.tsx` detects `badgeEarned` transition via `useRef(prevBadgeEarned)`
- When transition detected: cancel auto-advance timer, show modal
- "Claim Badge" → `handleClaimBadge()` → on success, ResultOverlay shows → on dismiss, auto-advance resumes
- "Submit Score" → `handleSubmitScore()` → same flow
- "Later" → close modal, resume auto-advance to next piece (or stay if last piece)
- Modal blocks board interaction layer

### Component

New component: `BadgeEarnedPrompt` in `result-overlay.tsx` (same file, reuses SuccessImage, StarsRow, branding footer).

### Props

```typescript
type BadgeEarnedPromptProps = {
  pieceType: PieceKey;
  totalStars: number;
  onClaimBadge: () => void;
  onSubmitScore: () => void;
  onLater: () => void;
};
```

## Fix A: Pulsing Notification Dot

When `canClaim` is true on the badge action button, show a pulsing amber dot.

### Visual

- 8px amber dot, `absolute -top-1 -right-1`
- Double layer: static `bg-amber-400` + `animate-ping bg-amber-400` overlay
- Disappears when `canClaim` is false
- Same pattern for score button when `canSubmit` is true

### Implementation

- Add `showNotification?: boolean` prop to `ActionBtn` in `onchain-actions-panel.tsx`
- Pass `showNotification={canClaim}` for badge button, `showNotification={canSubmit}` for score button

## Out of Scope

- Sound effects
- Confetti / particles
- Per-exercise celebration
- "Game complete" screen (all 3 pieces done)
