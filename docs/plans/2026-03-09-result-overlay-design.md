# Result Overlay — Design Doc

**Date:** 2026-03-09
**Problem:** Users get zero feedback after on-chain transactions in MiniPay production. No success screen, no error notification. The `StatusStrip` + `TxFeedbackCard` only renders on localhost.

## Component: `<ResultOverlay />`

Fullscreen modal overlay for post-transaction feedback. Covers both success and error states.

### Variants

| Variant | Image | Title | Subtitle |
|---------|-------|-------|----------|
| `badge` | Piece-specific badge art | "Badge Claimed!" | "{Piece} Ascendant is now in your wallet" |
| `score` | `score-chesscito` icon (large) | "Score Recorded!" | "Your score is now on-chain" |
| `shop` | Item art (Founder Badge) | "Purchase Complete!" | "Founder Badge acquired — thank you for supporting Chesscito" |
| `error` | Warning icon (no image) | "Transaction Failed" | Contextual message (e.g. "Rejected by wallet") |

### Layout (success)

```
Fullscreen backdrop (dark)
  reward-glow.png (pulsing, behind image)
  Large image (badge/item/icon)
  Title (fantasy-title style)
  Subtitle (1-2 lines)
  [View on CeloScan] link (optional, if txHash present)
  [Continue] button → dismisses overlay
```

### Layout (error)

```
Fullscreen backdrop (dark)
  Warning icon
  Title: "Transaction Failed"
  Subtitle: contextual message (no tech jargon, no tx hashes)
  [Try Again] button → retries the action
  [Dismiss] link → closes overlay
```

### Animation

- **Enter:** backdrop fade-in 300ms, content scale(0.9 -> 1.0) + fade-in 400ms
- **Glow:** `reward-glow.png` with `.reward-burst` keyframe (already exists in globals.css)
- **Exit:** fade-out 200ms on dismiss

### Props

```typescript
type ResultOverlayProps = {
  variant: "badge" | "score" | "shop" | "error";
  pieceType?: PieceKey;         // for badge variant — determines image/title
  itemLabel?: string;           // for shop variant — item name
  txHash?: string;              // optional CeloScan link
  celoscanHref?: string;        // pre-built link
  errorMessage?: string;        // for error variant — contextual message
  onDismiss: () => void;        // close overlay
  onRetry?: () => void;         // error variant — retry action
};
```

### Integration in `page.tsx`

- Triggers AFTER `useWaitForTransactionReceipt` resolves (success) or rejects (error)
- New state: `resultOverlay: { variant, ... } | null`
- On tx success → set overlay with variant + txHash
- On tx error → set overlay with variant="error" + message
- On dismiss → set overlay to null
- `StatusStrip` remains for localhost/QA only (technical debug info)

### Data flow

```
User taps Claim Badge / Submit Score / Buy Item
  → writeContract() via wagmi
  → MiniPay signing prompt
    ├── tx confirmed → setResultOverlay({ variant, txHash })
    └── error/reject → setResultOverlay({ variant: "error", errorMessage })

User taps Continue/Dismiss
  → setResultOverlay(null)
```

### Error messages (contextual, level B)

| Condition | Message |
|-----------|---------|
| User rejected in wallet | "Transaction was cancelled" |
| Insufficient funds | "Not enough funds to complete this transaction" |
| Network error | "Network error — check your connection and try again" |
| Contract revert | "Transaction failed — this action may not be available right now" |
| Unknown | "Something went wrong. Please try again" |

### Assets used

- `reward-glow.png` / `.webp` / `.avif` — glow behind success image
- `piece-rook.png`, `piece-bishop.png`, `piece-knight.png` — badge variant images
- `score-chesscito.png` — score variant image
- `shop-chesscito.png` or item-specific art — shop variant image
- `.reward-burst` CSS keyframe — already defined in globals.css

### Out of scope

- Confetti / particle effects
- Sound effects
- Celebration for individual exercise completion
- Celebration for local badge unlock (pre-tx)
- "Game complete" screen (all 3 pieces done)
- Custom per-item shop art (uses generic for now)
