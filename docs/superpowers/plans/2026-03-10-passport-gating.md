# Passport Gating Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a "Verified" checkmark next to Passport-verified users on the leaderboard.

**Architecture:** Server-side only — `fetchLeaderboard()` queries Gitcoin Passport API for each address before truncating, attaches `isVerified` boolean. Frontend renders a checkmark icon + info banner. Graceful degradation if Passport API fails.

**Tech Stack:** Next.js 14 API routes, Gitcoin Passport REST API v2, Tailwind CSS

**Design doc:** `docs/plans/2026-03-10-passport-gating-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/src/lib/server/passport.ts` | **Create** | Passport API client — `checkPassportScore(address): Promise<boolean>` |
| `apps/web/src/lib/server/leaderboard.ts` | **Modify** | Extend `LeaderboardRow` type, call passport check before truncation |
| `apps/web/src/lib/content/editorial.ts` | **Modify** | Add `PASSPORT_COPY` constant |
| `apps/web/src/components/play-hub/leaderboard-sheet.tsx` | **Modify** | Render checkmark + info banner |
| `apps/web/src/app/leaderboard/page.tsx` | **Modify** | Render checkmark + info banner |
| `apps/web/.env.template` | **Modify** | Add `PASSPORT_API_KEY` and `PASSPORT_SCORER_ID` placeholders |

---

## Chunk 1: Backend — Passport Client + Leaderboard Integration

### Task 1: Create Passport API client

**Files:**
- Create: `apps/web/src/lib/server/passport.ts`

- [ ] **Step 1: Create `passport.ts` with `checkPassportScore` function**

```ts
const PASSPORT_API_BASE = "https://api.passport.xyz/v2/stamps";

export async function checkPassportScore(address: string): Promise<boolean> {
  const apiKey = process.env.PASSPORT_API_KEY;
  const scorerId = process.env.PASSPORT_SCORER_ID;

  if (!apiKey || !scorerId) return false;

  try {
    const res = await fetch(
      `${PASSPORT_API_BASE}/${scorerId}/score/${address}`,
      {
        headers: { "X-API-KEY": apiKey },
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.passing_score === true;
  } catch {
    return false;
  }
}

export async function checkPassportScores(
  addresses: string[]
): Promise<Map<string, boolean>> {
  const results = await Promise.allSettled(
    addresses.map(async (addr) => ({
      addr,
      verified: await checkPassportScore(addr),
    }))
  );
  const map = new Map<string, boolean>();
  for (const r of results) {
    if (r.status === "fulfilled") {
      map.set(r.value.addr, r.value.verified);
    }
  }
  return map;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/server/passport.ts
git commit -m "feat(passport): add Passport API client for score verification"
```

---

### Task 2: Extend LeaderboardRow and integrate Passport check

**Files:**
- Modify: `apps/web/src/lib/server/leaderboard.ts`

**Critical note:** The current code truncates addresses at line 44 (`player: addr.slice(0, 6) + "..." + addr.slice(-4)`). Passport lookup must happen BEFORE truncation, using the full addresses from the `best` Map.

- [ ] **Step 1: Add `isVerified` to `LeaderboardRow` type**

Change:
```ts
export type LeaderboardRow = {
  rank: number;
  player: string;
  score: number;
};
```

To:
```ts
export type LeaderboardRow = {
  rank: number;
  player: string;
  score: number;
  isVerified?: boolean;
};
```

- [ ] **Step 2: Import and call `checkPassportScores` before address truncation**

Add import at top:
```ts
import { checkPassportScores } from "./passport";
```

Replace the final `return` block (lines 39-46) with:
```ts
  const sorted = Array.from(best.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const fullAddresses = sorted.map(([addr]) => addr);
  const verifiedMap = await checkPassportScores(fullAddresses);

  return sorted.map(([addr, score], i) => ({
    rank: i + 1,
    player: addr.slice(0, 6) + "..." + addr.slice(-4),
    score,
    isVerified: verifiedMap.get(addr) ?? false,
  }));
```

- [ ] **Step 3: Verify the dev server starts without errors**

Run: `cd apps/web && pnpm dev` — check no TypeScript/import errors in terminal.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/server/leaderboard.ts
git commit -m "feat(passport): integrate Passport verification into leaderboard"
```

---

## Chunk 2: Frontend — Leaderboard UI + Editorial Copy

### Task 3: Add Passport copy to editorial.ts

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts`

- [ ] **Step 1: Add `PASSPORT_COPY` constant after `SHIELD_COPY`**

```ts
export const PASSPORT_COPY = {
  verifiedLabel: "Verified",
  infoBanner: "Verify with Gitcoin Passport to earn a \u2713",
  passportUrl: "https://passport.gitcoin.co",
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts
git commit -m "feat(passport): add Passport copy to editorial"
```

---

### Task 4: Render checkmark in LeaderboardSheet (play-hub)

**Files:**
- Modify: `apps/web/src/components/play-hub/leaderboard-sheet.tsx`

- [ ] **Step 1: Add import for `PASSPORT_COPY`**

```ts
import { PASSPORT_COPY } from "@/lib/content/editorial";
```

- [ ] **Step 2: Add info banner inside SheetContent, between SheetHeader and rows list**

Insert between the `</SheetHeader>` block (ends at line 56) and `<div className="mt-4 space-y-2">` (line 57) — the banner goes as a sibling after `SheetHeader`, not inside it:

```tsx
        <p className="mt-3 text-center text-xs text-cyan-100/60">
          {PASSPORT_COPY.infoBanner}{" "}
          <a
            href={PASSPORT_COPY.passportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-cyan-300/80 hover:text-cyan-200"
          >
            Get verified
          </a>
        </p>
```

- [ ] **Step 3: Add checkmark next to verified player names**

Change the player name cell (line 70):
```tsx
              <p className="text-sm text-slate-300">{row.player}</p>
```

To:
```tsx
              <p className="text-sm text-slate-300">
                {row.player}
                {row.isVerified && (
                  <span className="ml-1.5 inline-block text-emerald-400" title={PASSPORT_COPY.verifiedLabel}>
                    ✓
                  </span>
                )}
              </p>
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/leaderboard-sheet.tsx
git commit -m "feat(passport): show verified checkmark in LeaderboardSheet"
```

---

### Task 5: Render checkmark on standalone leaderboard page

**Files:**
- Modify: `apps/web/src/app/leaderboard/page.tsx`

- [ ] **Step 1: Add import for `PASSPORT_COPY`**

```ts
import { CTA_LABELS, LEADERBOARD_COPY, PASSPORT_COPY } from "@/lib/content/editorial";
```

- [ ] **Step 2: Add info banner before the rows list**

Insert inside the `<AppShell>` children, before `<div className="space-y-3">`:

```tsx
      <p className="mb-4 text-center text-xs text-slate-500">
        {PASSPORT_COPY.infoBanner}{" "}
        <a
          href={PASSPORT_COPY.passportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary hover:text-primary/80"
        >
          Get verified
        </a>
      </p>
```

- [ ] **Step 3: Add checkmark next to verified player names**

Change the player name line (line 31):
```tsx
              <p className="text-sm font-semibold text-slate-950">{row.player}</p>
```

To:
```tsx
              <p className="text-sm font-semibold text-slate-950">
                {row.player}
                {row.isVerified && (
                  <span className="ml-1.5 text-emerald-600" title={PASSPORT_COPY.verifiedLabel}>
                    ✓
                  </span>
                )}
              </p>
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/leaderboard/page.tsx
git commit -m "feat(passport): show verified checkmark on standalone leaderboard"
```

---

### Task 6: Update apps/web/.env.template

**Files:**
- Modify: `apps/web/.env.template` (NOT the root `.env.example` — that's for contracts)

- [ ] **Step 1: Add Passport env vars at the end of `apps/web/.env.template`**

```
# Gitcoin Passport gating (server-side only)
PASSPORT_API_KEY=
PASSPORT_SCORER_ID=
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/.env.template
git commit -m "chore: add Passport env vars to apps/web/.env.template"
```

---

## Chunk 3: Verification

### Task 7: End-to-end manual verification

- [ ] **Step 1: Start dev server**

Run: `cd apps/web && pnpm dev`

- [ ] **Step 2: Open `http://localhost:3000/api/leaderboard` in browser**

Expected: JSON array with `isVerified` field on each row. At least one `isVerified: true` if your test wallet has Passport score.

- [ ] **Step 3: Open `http://localhost:3000/leaderboard`**

Expected: Rows render with green checkmark next to verified players. Info banner visible at top with link to passport.gitcoin.co.

- [ ] **Step 4: Open play-hub, tap leaderboard icon**

Expected: LeaderboardSheet shows same checkmarks and info banner.

- [ ] **Step 5: Test graceful degradation — temporarily set invalid `PASSPORT_API_KEY`**

Expected: Leaderboard loads normally, no checkmarks, no errors.

- [ ] **Step 6: Restore correct env vars, final commit if any cleanup needed**
