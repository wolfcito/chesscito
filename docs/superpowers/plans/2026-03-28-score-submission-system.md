# Score Submission System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform score submission from an isolated button into a metagame system — internally per-piece, externally global, with correct CTA priority and leaderboard aggregation.

**Architecture:** 7 tasks across 4 layers: (1) leaderboard indexer rewrite for per-piece aggregation, (2) contract audit for daily limits, (3) context-action priority fix + wallet-state CTA, (4) submission feedback + success overlay with global total. No contract changes needed.

**Tech Stack:** TypeScript, ethers.js (indexer), Next.js API routes, React components, node:test

**Spec:** `docs/superpowers/specs/2026-03-28-score-submission-system-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/src/lib/server/leaderboard.ts` | Modify | Rewrite indexer: per-piece best → sum for global ranking |
| `apps/web/src/lib/game/context-action.ts` | Modify | Flip priority: claimBadge > submitScore. Add wallet-state actions. |
| `apps/web/src/lib/game/__tests__/context-action.test.ts` | Modify | Update tests for new priority + wallet-state actions |
| `apps/web/src/lib/content/editorial.ts` | Modify | New copy: cancel toast, failure toast, global total label, updated subtitle |
| `apps/web/src/components/play-hub/contextual-action-slot.tsx` | Modify | Handle new wallet-state actions (connectWallet, switchNetwork) |
| `apps/web/src/components/play-hub/result-overlay.tsx` | Modify | Add global total hint to score variant |
| `apps/web/src/app/page.tsx` | Modify | Submission cancel/error toasts, pass globalTotal to overlay |

---

## Task 1: Leaderboard Indexer — Per-Piece Aggregation

**Risk:** Medium — changes ranking for all existing players (scores only go up or stay same).
**QA:** Leaderboard API returns correct global totals. Players with multiple piece submissions see sum.

**Files:**
- Modify: `apps/web/src/lib/server/leaderboard.ts:37-89`

- [ ] **Step 1: Rewrite the event processing loop**

Replace the `fetchLeaderboard` function body (lines 37-89) with:

```typescript
export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const address = process.env.NEXT_PUBLIC_SCOREBOARD_ADDRESS ?? "";
  if (!address) return [];

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const currentBlock = await provider.getBlockNumber();

  const logs = await getLogsPaginated(provider, {
    address,
    topics: [SCORE_SUBMITTED_TOPIC],
    fromBlock: DEPLOY_BLOCK,
    toBlock: currentBlock,
  });

  // Build best score per player per levelId
  const bestPerLevel = new Map<string, Map<number, number>>();
  for (const log of logs) {
    try {
      const topic1 = log.topics[1];
      const topic2 = log.topics[2];
      if (!topic1 || topic1.length < 42) continue;
      if (!topic2) continue;
      if (!log.data || log.data.length < 66) continue;

      const player = ethers.getAddress("0x" + topic1.slice(26));
      const levelId = Number(ethers.toBigInt(topic2));
      const scoreBig = ethers.toBigInt(log.data.slice(0, 66));
      const score = Number(scoreBig);
      if (!Number.isSafeInteger(score) || score < 0) continue;

      let levels = bestPerLevel.get(player);
      if (!levels) {
        levels = new Map<number, number>();
        bestPerLevel.set(player, levels);
      }
      const prev = levels.get(levelId) ?? 0;
      if (score > prev) levels.set(levelId, score);
    } catch {
      continue;
    }
  }

  // Sum best-per-piece into global total
  const totals: [string, number][] = [];
  for (const [player, levels] of bestPerLevel) {
    let total = 0;
    for (const score of levels.values()) total += score;
    if (total > 0) totals.push([player, total]);
  }

  // Sort by total descending, then by address for deterministic tie order
  totals.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = totals.slice(0, 10);

  const fullAddresses = top.map(([addr]) => addr);
  const verifiedMap = await checkPassportScores(fullAddresses);

  // Assign ranks with ties (same score = same rank, skip next)
  const rows: LeaderboardRow[] = [];
  let currentRank = 1;
  for (let i = 0; i < top.length; i++) {
    const [addr, score] = top[i];
    if (i > 0 && score < top[i - 1][1]) {
      currentRank = i + 1;
    }
    rows.push({
      rank: currentRank,
      player: addr.slice(0, 6) + "..." + addr.slice(-4),
      score,
      isVerified: verifiedMap.get(addr) ?? false,
    });
  }

  return rows;
}
```

- [ ] **Step 2: Build to verify**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds. No type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/server/leaderboard.ts
git commit -m "$(cat <<'EOF'
feat: leaderboard indexer — sum best-per-piece into global total

Rewrite event processing to track best score per player per levelId,
then sum into one global ranking. Explicit tie handling (same rank,
skip next). Deterministic tie order by address.

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

## Task 2: maxSubmissionsPerDay Audit

**Risk:** Low — read-only check. Admin call only if needed.
**QA:** Verify current value and document whether it needs raising.

**Files:**
- No file changes — this is a contract read + documentation task

- [ ] **Step 1: Read current maxSubmissionsPerDay from mainnet**

Run:
```bash
cast call 0x1681aAA176d5f46e45789A8b18C8E990f663959a "maxSubmissionsPerDay()" --rpc-url https://forno.celo.org
```

If `cast` is not available, use this alternative:
```bash
curl -s -X POST https://forno.celo.org -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x1681aAA176d5f46e45789A8b18C8E990f663959a","data":"0x1624f6c6"},"latest"],"id":1}' | jq -r '.result' | xargs printf "%d\n"
```

The function selector `0x1624f6c6` is `keccak256("maxSubmissionsPerDay()")` truncated to 4 bytes.

- [ ] **Step 2: Read current submitCooldown**

Run:
```bash
cast call 0x1681aAA176d5f46e45789A8b18C8E990f663959a "submitCooldown()" --rpc-url https://forno.celo.org
```

Or via curl:
```bash
curl -s -X POST https://forno.celo.org -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x1681aAA176d5f46e45789A8b18C8E990f663959a","data":"0x7c0a893d"},"latest"],"id":1}' | jq -r '.result' | xargs printf "%d\n"
```

- [ ] **Step 3: Document findings and recommend action**

If `maxSubmissionsPerDay` < 6: recommend raising to at least 10 (allows improving all 6 pieces in one session plus retries). Flag this to the user for admin action.

If `maxSubmissionsPerDay` >= 6: document as acceptable, no action needed.

If `submitCooldown` > 0: document the value. If > 300 seconds (5 min), recommend reducing for smoother multi-piece sessions.

Report findings in commit message or session notes — no code changes required unless admin action is taken.

---

## Task 3: Context Action Priority Fix + Wallet-State Actions

**Risk:** Low — pure function with existing tests. Changes priority order + adds new action types.
**QA:**
- When both `scorePending` and `badgeClaimable` are true: returns `claimBadge` (was `submitScore`).
- When not connected + `scorePending`: returns `connectWallet`.
- When wrong chain + `scorePending`: returns `switchNetwork`.
- All 11 existing test cases updated. New test cases for wallet-state actions.

**Files:**
- Modify: `apps/web/src/lib/game/context-action.ts`
- Modify: `apps/web/src/lib/game/__tests__/context-action.test.ts`

- [ ] **Step 1: Update the ContextAction type and function**

Replace the entire `apps/web/src/lib/game/context-action.ts`:

```typescript
export type ContextAction =
  | "submitScore"
  | "useShield"
  | "claimBadge"
  | "retry"
  | "connectWallet"
  | "switchNetwork"
  | null;

export type ContextActionState = {
  phase: "ready" | "success" | "failure";
  shieldsAvailable: number;
  scorePending: boolean;
  badgeClaimable: boolean;
  isConnected: boolean;
  isCorrectChain: boolean;
};

export function getContextAction(state: ContextActionState): ContextAction {
  // Failure recovery always takes priority
  if (state.phase === "failure") {
    if (!state.isConnected || !state.isCorrectChain) return null;
    return state.shieldsAvailable > 0 ? "useShield" : "retry";
  }

  // Badge > Score when both available (reward before record)
  if (state.isConnected && state.isCorrectChain) {
    if (state.badgeClaimable) return "claimBadge";
    if (state.scorePending) return "submitScore";
    return null;
  }

  // Wallet-state actions: show resolutive CTA when score is pending but wallet blocks
  if (state.scorePending || state.badgeClaimable) {
    if (!state.isConnected) return "connectWallet";
    if (!state.isCorrectChain) return "switchNetwork";
  }

  return null;
}
```

- [ ] **Step 2: Update tests**

Replace the entire `apps/web/src/lib/game/__tests__/context-action.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getContextAction } from "../context-action.js";
import type { ContextActionState } from "../context-action.js";

const BASE: ContextActionState = {
  phase: "ready",
  shieldsAvailable: 0,
  scorePending: false,
  badgeClaimable: false,
  isConnected: true,
  isCorrectChain: true,
};

describe("getContextAction", () => {
  // ── Wallet guards ──────────────────────────────────────
  it("returns null when disconnected and nothing pending", () => {
    assert.equal(
      getContextAction({ ...BASE, isConnected: false }),
      null
    );
  });

  it("returns null when wrong chain and nothing pending", () => {
    assert.equal(
      getContextAction({ ...BASE, isCorrectChain: false }),
      null
    );
  });

  // ── Wallet-state actions ───────────────────────────────
  it("returns connectWallet when disconnected with score pending", () => {
    assert.equal(
      getContextAction({ ...BASE, isConnected: false, scorePending: true }),
      "connectWallet"
    );
  });

  it("returns switchNetwork when wrong chain with score pending", () => {
    assert.equal(
      getContextAction({ ...BASE, isConnected: true, isCorrectChain: false, scorePending: true }),
      "switchNetwork"
    );
  });

  it("returns connectWallet when disconnected with badge claimable", () => {
    assert.equal(
      getContextAction({ ...BASE, isConnected: false, badgeClaimable: true }),
      "connectWallet"
    );
  });

  // ── Normal gameplay ────────────────────────────────────
  it("returns null during normal gameplay (ready phase)", () => {
    assert.equal(getContextAction(BASE), null);
  });

  it("returns null during success phase (auto-advance)", () => {
    assert.equal(
      getContextAction({ ...BASE, phase: "success" }),
      null
    );
  });

  // ── Failure states ─────────────────────────────────────
  it("returns useShield on failure with shields available", () => {
    assert.equal(
      getContextAction({ ...BASE, phase: "failure", shieldsAvailable: 3 }),
      "useShield"
    );
  });

  it("returns retry on failure with no shields", () => {
    assert.equal(
      getContextAction({ ...BASE, phase: "failure", shieldsAvailable: 0 }),
      "retry"
    );
  });

  it("returns null on failure when disconnected", () => {
    assert.equal(
      getContextAction({ ...BASE, phase: "failure", isConnected: false }),
      null
    );
  });

  // ── Progression states ─────────────────────────────────
  it("returns submitScore when score is pending", () => {
    assert.equal(
      getContextAction({ ...BASE, scorePending: true }),
      "submitScore"
    );
  });

  it("returns claimBadge when badge is claimable", () => {
    assert.equal(
      getContextAction({ ...BASE, badgeClaimable: true }),
      "claimBadge"
    );
  });

  // ── Priority: claimBadge > submitScore ─────────────────
  it("prioritizes claimBadge over submitScore", () => {
    assert.equal(
      getContextAction({ ...BASE, scorePending: true, badgeClaimable: true }),
      "claimBadge"
    );
  });

  // ── Priority: failure > everything ─────────────────────
  it("prioritizes useShield over scorePending on failure", () => {
    assert.equal(
      getContextAction({
        ...BASE,
        phase: "failure",
        shieldsAvailable: 2,
        scorePending: true,
      }),
      "useShield"
    );
  });

  it("prioritizes retry over badgeClaimable on failure without shields", () => {
    assert.equal(
      getContextAction({
        ...BASE,
        phase: "failure",
        shieldsAvailable: 0,
        badgeClaimable: true,
      }),
      "retry"
    );
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && node --test apps/web/src/lib/game/__tests__/context-action.test.ts`
Expected: All 15 tests pass.

- [ ] **Step 4: Build to verify**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/game/context-action.ts apps/web/src/lib/game/__tests__/context-action.test.ts
git commit -m "$(cat <<'EOF'
feat: context-action — badge > score priority + wallet-state CTAs

Flip priority: claimBadge now takes precedence over submitScore
when both are available (reward before record).

Add connectWallet and switchNetwork action types — shown when
score/badge is pending but wallet blocks submission.

15 tests passing (was 11).

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

## Task 4: Wallet-State CTA in ContextualActionSlot

**Risk:** Low — adding new action types to existing component.
**QA:**
- Disconnect wallet with score pending → "Connect Wallet" button appears in CTA slot.
- Wrong chain with score pending → "Switch Network" button appears.
- Clicking "Connect Wallet" triggers wallet connection flow.

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts:21-27` (FOOTER_CTA_COPY)
- Modify: `apps/web/src/components/play-hub/contextual-action-slot.tsx`
- Modify: `apps/web/src/app/page.tsx` (pass new handlers)

- [ ] **Step 1: Add editorial constants for wallet-state CTAs**

In `apps/web/src/lib/content/editorial.ts`, add to `FOOTER_CTA_COPY` (after line 25, before `shieldsLeft`):

```typescript
  connectWallet: { label: "Connect Wallet", loading: null },
  switchNetwork: { label: "Switch Network", loading: null },
```

- [ ] **Step 2: Add styles and icons for wallet-state actions**

In `apps/web/src/components/play-hub/contextual-action-slot.tsx`:

Add `Wallet, ArrowLeftRight` to the lucide-react import (line 6):
```typescript
import { Star, Shield, Award, RotateCcw, Swords, Wallet, ArrowLeftRight } from "lucide-react";
```

Add to `ACTION_STYLES` (after `retry`, before closing `}`):
```typescript
  connectWallet: {
    bg: "bg-gradient-to-b from-[#23C8F3] to-[#16A9E0]",
    glow: "shadow-[0_0_20px_rgba(35,200,243,0.24)]",
    text: "text-white",
  },
  switchNetwork: {
    bg: "bg-gradient-to-b from-[#F6A400] to-[#EE8B00]",
    glow: "shadow-[0_0_20px_rgba(246,164,0,0.22)]",
    text: "text-[#FFF8ED]",
  },
```

Add to `ACTION_ICON` (after `retry`):
```typescript
  connectWallet: Wallet,
  switchNetwork: ArrowLeftRight,
```

- [ ] **Step 3: Update Props type and handler mapping**

In `contextual-action-slot.tsx`, add to `ContextualActionSlotProps`:
```typescript
  onConnectWallet: () => void;
  onSwitchNetwork: () => void;
```

Add cases to `getHandler`:
```typescript
    case "connectWallet": return props.onConnectWallet;
    case "switchNetwork": return props.onSwitchNetwork;
```

- [ ] **Step 4: Pass handlers from page.tsx**

In `apps/web/src/app/page.tsx`, find where `<ContextualActionSlot>` is rendered and add:
```typescript
  onConnectWallet={() => { /* wagmi's connect modal — use open() from useConnectModal or similar */ }}
  onSwitchNetwork={() => { /* wagmi's switchChain — use switchChain() from useSwitchChain */ }}
```

Note: The exact wagmi hooks depend on what's already imported in page.tsx. Check existing imports for `useConnectModal`, `useWeb3Modal`, or similar. If no modal hook exists, use a simple `alert("Please connect your wallet")` as a v1 placeholder and add a TODO comment.

- [ ] **Step 5: Build to verify**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts apps/web/src/components/play-hub/contextual-action-slot.tsx apps/web/src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat: wallet-state CTA slot — Connect Wallet / Switch Network

Show resolutive action in CTA slot when score/badge is pending
but wallet blocks submission. Never a dead end.

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

## Task 5: Submission Feedback — Cancel and Error Toasts

**Risk:** Low — additive UI feedback, no logic changes.
**QA:**
- Cancel wallet during submission → light toast "Submission canceled" (2s).
- Transaction fails → toast "Submission failed — try again" (3s).
- Both toasts fade in/out, don't block interaction.

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts` (add toast copy)
- Modify: `apps/web/src/app/page.tsx:554-595` (handleSubmitScore)

- [ ] **Step 1: Add toast editorial constants**

In `apps/web/src/lib/content/editorial.ts`, add to `FOOTER_CTA_COPY` (after the new `switchNetwork` line):

```typescript
  submitCanceled: "Submission canceled",
  submitFailed: "Submission failed — try again",
```

- [ ] **Step 2: Add toast state and UI in page.tsx**

In `apps/web/src/app/page.tsx`, find the state declarations near the top of the component. Add:

```typescript
const [toast, setToast] = useState<string | null>(null);
```

Add a toast auto-dismiss helper:
```typescript
function showToast(msg: string, durationMs = 2000) {
  setToast(msg);
  setTimeout(() => setToast(null), durationMs);
}
```

- [ ] **Step 3: Update handleSubmitScore for cancel and error feedback**

In `handleSubmitScore()` (line 584-585), replace:
```typescript
      if (isUserCancellation(error)) return;
```
with:
```typescript
      if (isUserCancellation(error)) {
        showToast(FOOTER_CTA_COPY.submitCanceled, 2000);
        return;
      }
```

And add `FOOTER_CTA_COPY` to the imports from editorial.ts if not already imported.

After the error overlay is set (line 588-592), add a toast as well:
```typescript
      showToast(FOOTER_CTA_COPY.submitFailed, 3000);
```

- [ ] **Step 4: Render toast in JSX**

Find a suitable location in the page.tsx JSX (near the bottom of the main content area, before closing `</main>`). Add:

```tsx
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-2xl border border-white/[0.08] bg-[var(--surface-frosted)] px-4 py-2.5 text-sm text-cyan-100/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast}
        </div>
      )}
```

- [ ] **Step 5: Build to verify**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts apps/web/src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat: submission feedback — cancel and error toasts

Show light inline toast on wallet cancel ("Submission canceled", 2s)
and on tx failure ("Submission failed — try again", 3s).

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

## Task 6: Global Total in Success Overlay

**Risk:** Low — additive display, no logic changes.
**QA:**
- Submit score → success overlay shows piece score + "Total: X,XXX pts" below.
- Updated success subtitle: "Your score is now recorded on the blockchain."

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts:61-90` (RESULT_OVERLAY_COPY)
- Modify: `apps/web/src/components/play-hub/result-overlay.tsx`
- Modify: `apps/web/src/app/page.tsx` (pass globalTotal prop)

- [ ] **Step 1: Update editorial constants**

In `apps/web/src/lib/content/editorial.ts`, update `RESULT_OVERLAY_COPY.score` (line 66-68):

```typescript
  score: {
    title: "Score Recorded!",
    subtitle: "Your score is now recorded on the blockchain.",
    globalTotalLabel: (total: number) => `Total: ${total.toLocaleString()} pts`,
  },
```

- [ ] **Step 2: Update ResultOverlay component**

In `apps/web/src/components/play-hub/result-overlay.tsx`:

Add `globalTotal` to `ResultOverlayProps` (after `totalStars`, line 22):
```typescript
  globalTotal?: number;
```

Update the `getSubtitle` function call — no changes needed (subtitle is already pulled from RESULT_OVERLAY_COPY.score.subtitle).

After the `StarsRow` rendering (line 200-202), add the global total display:

```tsx
        {/* Global total (score variant only) */}
        {!isError && variant === "score" && globalTotal != null && globalTotal > 0 ? (
          <p className="text-sm font-semibold text-cyan-100/60">
            {RESULT_OVERLAY_COPY.score.globalTotalLabel(globalTotal)}
          </p>
        ) : null}
```

Update the component signature to accept `globalTotal`:
```typescript
export function ResultOverlay({
  variant,
  pieceType,
  itemLabel,
  txHash,
  celoscanHref,
  errorMessage,
  onDismiss,
  onRetry,
  totalStars,
  globalTotal,
}: ResultOverlayProps) {
```

- [ ] **Step 3: Compute and pass globalTotal from page.tsx**

In `apps/web/src/app/page.tsx`, find where `setResultOverlay` is called for score success (around line 579-582). The overlay needs a `globalTotal` value.

Compute global total from localStorage progress across all pieces. Find where piece progress is loaded (likely via `useExerciseProgress`). Add a computation:

```typescript
// Compute global total from all pieces' current stars
const POINTS_PER_STAR = 100;
const allPieces = ["rook", "bishop", "knight", "pawn", "queen", "king"] as const;
```

The exact implementation depends on how piece progress is accessed in page.tsx. The simplest approach: read each piece's progress from the existing `useExerciseProgress` hook or directly from localStorage, sum `totalStars * 100` across all pieces.

Pass to the overlay:
```typescript
      setResultOverlay({
        variant: "score",
        txHash,
        globalTotal: computeGlobalTotal(), // sum of all pieces' totalStars * 100
      });
```

Note: The implementer should read how `useExerciseProgress` works in page.tsx and follow the existing pattern for reading piece progress. The function should sum `stars.reduce((a, b) => a + b, 0) * 100` across all 6 pieces.

- [ ] **Step 4: Build to verify**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts apps/web/src/components/play-hub/result-overlay.tsx apps/web/src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat: global total in success overlay + updated subtitle

Show "Total: X,XXX pts" below piece score in success overlay.
Updated subtitle: "Your score is now recorded on the blockchain."
Global total computed from localStorage (all pieces summed).

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

## Task 7: Final Build + Test Verification

**Risk:** None — verification only.
**QA:** Build passes, all tests pass, commit history clean.

- [ ] **Step 1: Run all tests**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && node --test apps/web/src/lib/game/__tests__/context-action.test.ts`
Expected: 15 tests pass.

- [ ] **Step 2: Run full build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build`
Expected: All pages compile. No type errors.

- [ ] **Step 3: Verify commit history**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && git log --oneline -8`
Expected: 6 commits from this plan (indexer + context-action + wallet CTA + toasts + overlay + editorial spread across tasks).

- [ ] **Step 4: Verify no sensitive files staged**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && git diff --staged`
Expected: Empty.

---

## Incremental Ship Strategy

| After task | State | Safe to ship? |
|------------|-------|---------------|
| 1 (indexer) | Leaderboard shows global totals. All other UI unchanged. | **Yes — ship here for immediate leaderboard fix** |
| 2 (audit) | Contract limits verified. No code change. | Yes (no-op) |
| 3 (context-action) | Badge > Score priority. Wallet actions in type system but not yet rendered. | Yes (priority fix live, wallet actions return null in old component) |
| 4 (wallet CTA) | Connect Wallet / Switch Network visible in CTA slot. | Yes |
| 5 (toasts) | Cancel/error toasts appear. | Yes |
| 6 (overlay) | Global total in success overlay. | **Yes — full P0 Must-Ship complete** |
| 7 (verify) | Verification only. | Yes |

**Recommended ship points:** After Task 1 (leaderboard fix is visible immediately) and after Task 6 (full P0 complete).
