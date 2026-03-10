# Passport Gating — Design

**Goal:** Show a "Verified" checkmark next to Passport-verified users on the leaderboard. No blocking, no client widget — server-side check only.

---

## How It Works

1. `/api/leaderboard` already returns `LeaderboardRow[]` with `{ rank, player, score }`
2. For each address in the results, the API calls Passport: `GET https://api.passport.xyz/v2/stamps/{scorer_id}/score/{address}`
3. If `passing_score === true`, attach `isVerified: true` to that row
4. Frontend renders a checkmark icon next to verified players

## Environment Variables

- `PASSPORT_API_KEY` — server-side only, in `.env`
- `PASSPORT_SCORER_ID` — server-side only, in `.env`
- Add to `.env.example` as placeholders

## API Change

`LeaderboardRow` type gains `isVerified?: boolean`. The leaderboard API fetches Passport scores in parallel for all addresses (Promise.all), with try/catch that defaults to `false` on failure (Passport API down shouldn't break the leaderboard).

## Frontend Change

- Leaderboard sheet: render checkmark/shield icon next to verified player names
- Info line at top: "Verify with Gitcoin Passport to earn a ✓" with link to `https://passport.gitcoin.co`
- Standalone `/leaderboard` page: same treatment

## Scope

- Server-side Passport check only
- No client SDK or widget
- No blocking of any feature
- Graceful degradation if Passport API unavailable
- No caching for v1 (leaderboard already has `revalidate: 60s`)

## Files to Modify

- `apps/web/src/lib/server/leaderboard.ts` — add Passport check, extend LeaderboardRow type
- `apps/web/src/components/play-hub/leaderboard-sheet.tsx` — render checkmark + info line
- `apps/web/src/app/leaderboard/page.tsx` — render checkmark on standalone page
- `apps/web/src/lib/content/editorial.ts` — add passport copy
- `.env.example` — add PASSPORT_API_KEY and PASSPORT_SCORER_ID placeholders
