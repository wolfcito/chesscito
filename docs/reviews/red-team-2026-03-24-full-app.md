# Red Team Report — 2026-03-24 (Full App Audit)

## Scope

Full adversarial audit of Chesscito: play-hub, arena, secondary routes, API routes.
4 parallel agents, ~70 files reviewed.

---

## BROKEN FLOWS (app breaks or logic error)

| ID | Area | Issue | File | Severity |
|----|------|-------|------|----------|
| B1 | Play-hub | autoResetTimer fires with stale closure — user switches exercise mid-timer, progress jumps ahead | page.tsx:438-450 | HIGH |
| B2 | Play-hub | Shop `selectedItemId` not cleared on confirm sheet close — next purchase uses wrong item | page.tsx:743-747 | HIGH |
| B3 | Play-hub | Board can receive input during success/failure lock window (queued clicks) | board.tsx:84-86 | MEDIUM |
| B4 | Play-hub | Shield usable during success phase if clicked fast enough | context-action.ts:17-27 | LOW |
| B5 | Arena | Board not locked during promotion overlay — user can click other squares | arena/page.tsx:441 | MEDIUM |
| B6 | Arena | Signature expiry not validated in UI — user delays 10 min, claim silently reverts | arena/page.tsx:264-277 | MEDIUM |
| B7 | Routes | Legal pages `router.back()` with empty history — navigates out of app in MiniPay | legal-page-shell.tsx:20-21 | HIGH |
| B8 | Routes | /victory/[id] no error boundary — server errors crash with no recovery | victory/[id]/page.tsx | MEDIUM |
| B9 | API | Leaderboard log.topics[1] sliced without bounds check — crash on malformed events | leaderboard.ts:53-56 | HIGH |
| B10 | API | Leaderboard log.data.slice(0,66) no length check — garbage scores | leaderboard.ts:54-56 | HIGH |
| B11 | API | verify-purchase log.topics bounds missing — undefined reads | coach/verify-purchase:60-62 | MEDIUM |

## DEAD ENDS (user stuck, no recovery path)

| ID | Area | Issue | File |
|----|------|-------|------|
| D1 | Play-hub | Last exercise + badge earned = phase stuck on "success" forever (early return skips timer) | page.tsx:424-436 |
| D2 | Play-hub | Badge earned prompt + claim button race — both execute, state conflicts | page.tsx:476-486 |
| D3 | Arena | Wallet disconnect mid-mint — "Try Again" button silent no-op (address=null) | arena/page.tsx:255-377 |
| D4 | Arena | Coach loading modal has no cancel/abort — stuck if job hangs | arena/page.tsx:500-511 |
| D5 | Routes | Leaderboard sheet fetch error — no retry button | leaderboard-sheet.tsx:74 |
| D6 | Routes | /leaderboard full page is orphaned — no navigation link points to it | N/A |

## STATE LEAKS (subtle bugs, wrong data shown)

| ID | Area | Issue | File |
|----|------|-------|------|
| L1 | Play-hub | resultOverlay persists across piece switch (rook overlay + bishop board) | page.tsx:835-846 |
| L2 | Play-hub | claimTxHash / submitTxHash not cleared on piece change | page.tsx:126-127 |
| L3 | Play-hub | showBadgeEarned not cleared on piece change — stale banner | page.tsx:136 |
| L4 | Arena | claimData in sessionStorage leaks old victory card on page refresh | arena/page.tsx:82-104 |

## RACE CONDITIONS (timing bugs)

| ID | Area | Issue | File |
|----|------|-------|------|
| R1 | Play-hub | Shop approve succeeds but buy fails — orphaned allowance, retry creates duplicate approval | page.tsx:605-638 |
| R2 | Play-hub | Badge refetch stale — hasClaimedBadge false during query, double-claim possible | page.tsx:309-328 |
| R3 | Arena | Promotion overlay + AI thinking can fire concurrently — inconsistent game state | use-chess-game.ts:83-125 |
| R4 | Arena | Resign doesn't abort pending AI setTimeout — state writes after resign | use-chess-game.ts:230-233 |
| R5 | Arena | elapsedMs snapshot race with "Play Again" — stale time on claim | use-chess-game.ts:77-81 |
| R6 | Routes | Badge claim in progress + sheet close — success overlay may not show | badge-sheet.tsx:139-145 |
| R7 | API | Free credits seeding non-atomic (two setnx calls) — double-credit on concurrent requests | coach/analyze:60-66, coach/credits:15-20 |

## SECURITY FINDINGS (API)

| ID | Issue | File | Impact |
|----|-------|------|--------|
| S1 | Coach job status endpoint lacks auth — any user can query any jobId | coach/job/[id]:8-15 | Leaks analysis results |
| S2 | Coach history endpoint no wallet verification — enumerate any user's analyses | coach/history:10-12 | Privacy violation |
| S3 | Coach credits endpoint no ownership check — enumerate balances | coach/credits:10-13 | Info disclosure |
| S4 | Games GET endpoint no auth — enumerate any user's game history | games/route.ts:49-52 | Privacy violation |
| S5 | my-victories no auth — enumerate victories for any address | my-victories/route.ts:12-20 | Privacy (on-chain data, lower impact) |
| S6 | Game validation accepts fake results — submit `result: "resigned"` for 1-move game | validate-game.ts:32-41 | Coach abuse |
| S7 | Game moves array elements not type-checked — non-strings pass validation | games/route.ts:26-27 | Stored bad data |
| S8 | verify-purchase doesn't verify wallet ownership — claim another user's purchase | coach/verify-purchase:61-65 | Credit theft |

## EDGE CASES (unhandled but unlikely)

| ID | Area | Issue | File |
|----|------|-------|------|
| E1 | Play-hub | currentExercise undefined if exerciseIndex corrupted | use-exercise-progress.ts:67 |
| E2 | Play-hub | Splash timeout before wallet ready in MiniPay — play without wallet | use-splash-loader.ts:76-84 |
| E3 | Play-hub | Timer after unmount — advanceExercise on dead component | page.tsx:172-177 |
| E4 | Play-hub | Board click queued during key change — move on wrong exercise | board.tsx:103 |
| E5 | Arena | fenToPieces returns [] silently — blank board, game still "playing" | arena-utils.ts:38-64 |
| E6 | Arena | selectSquare no try/catch on chess.js calls — unhandled throw on corrupt FEN | use-chess-game.ts:127-177 |
| E7 | Arena | Double-mint possible if page refreshes between sign and mint | arena/page.tsx:255-377 |
| E8 | Routes | Exercise drawer localStorage hack — bypass progression | exercise-drawer.tsx:54-61 |
| E9 | Routes | Shop unconfigured shows empty grid, no user message | shop-sheet.tsx:51 |
| E10 | Routes | /victory/[id] with invalid tokenId still renders — no 404 | victory/[id]/page.tsx:47 |
| E11 | API | Leaderboard score Number() overflow for values > 2^53 | leaderboard.ts:56 |
| E12 | API | HoF refresh lock expires before scan completes — duplicate refresh | hof-index.ts:19 |

## VERIFIED OK

- Play-hub exercise progression logic (goToExercise clamping works correctly)
- Tutorial system (cinematica) — first-visit detection and banner lifecycle
- Retry Shield localStorage persistence and MAX_SHIELDS cap (30)
- autoResetTimer cleanup on unmount (useEffect return)
- Splash loader asset preloading and timeout fallbacks
- HoF incremental scan dedup (ZADD idempotent)
- sign-victory rate limiting via Upstash Redis (persists across cold starts)
- sign-victory origin enforcement
- EIP-712 signature validation (contract-side, not bypassable)
- Error boundary for trophies (new, catches crashes)
- All legal pages render correctly (/terms, /privacy, /support, /about)
- Persistent dock navigation links all functional
- Arena difficulty selector state machine

## SUMMARY

| Category | Count |
|----------|-------|
| Broken flows | 11 |
| Dead ends | 6 |
| State leaks | 4 |
| Race conditions | 7 |
| Security findings | 8 |
| Edge cases | 12 |
| **Total findings** | **48** |
| Verified OK | 13 |
| Files audited | ~70 |

## PRIORITY TRIAGE

### Fix Now (pre-submission)
- **B7**: Legal pages `router.back()` — replace with `router.push("/about")` fallback
- **B9/B10**: Leaderboard bounds checks — server crash risk
- **D1**: Last exercise phase stuck — users get locked out

### Fix Soon (post-submission, pre-launch)
- **S1-S4**: Auth on coach/games endpoints — privacy violations
- **R7**: Atomic credit seeding — exploitable for free credits
- **S8**: verify-purchase wallet ownership — credit theft vector
- **B1**: autoResetTimer stale closure — exercise progression corruption
- **B2**: selectedItemId not cleared — wrong item purchased
- **D3**: Wallet disconnect mid-mint recovery

### Fix Later (hardening)
- All other race conditions and edge cases
- State leak cleanups on piece change
- Error boundaries for /victory/[id] and /arena
