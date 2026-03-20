# Trophy Vitrine — `/trophies`

**Issue**: #23 (redefined scope)
**Date**: 2026-03-19
**Status**: Design approved

---

## Overview

Public, mobile-first page (`/trophies`, max-width 390px) that surfaces minted Victory NFTs. Two data sections — personal victories (wallet required) and global Hall of Fame (public) — plus a static roadmap teaser. All data sourced from onchain `VictoryMinted` events. No contract changes, no indexer, no modifications to existing mint or share flows.

## Goals

- Give minted victories a permanent, revisitable home
- Enable re-sharing of past victories
- Show a public Hall of Fame to create social proof
- Tease future features without over-promising

## Non-Goals

- Pagination (future, out of scope)
- Indexer or subgraph
- Contract modifications
- New mint or share flows
- Achievement badges beyond what already exists
- Filtering or search

---

## UX Structure

Top to bottom, single scroll:

```
┌─────────────────────────────────┐
│  Page header: "Trophy Vitrine"  │
├─────────────────────────────────┤
│  Section 1: MY VICTORIES        │
│  (wallet required)              │
│  Victory cards, newest first    │
│  Each card: re-share button     │
├─────────────────────────────────┤
│  Section 2: HALL OF FAME        │
│  (public, no wallet needed)     │
│  Last 10 global victories       │
│  Cards show player address      │
├─────────────────────────────────┤
│  Banner: roadmap teaser         │
│  "More coming soon → ..."       │
└─────────────────────────────────┘
```

---

## Data Source

### Event

```solidity
event VictoryMinted(
    address indexed player,
    uint256 indexed tokenId,
    uint8 difficulty,
    uint16 totalMoves,
    uint32 timeMs,
    address indexed token,
    uint256 totalAmount
);
```

Contract: `0x0eE22F830a99e7a67079018670711C0F94Abeeb0` (Celo Mainnet)
Deployed: 2026-03-17

### Query strategy

Celo's public RPC (`forno.celo.org`) limits `getLogs` to ~10,000 blocks per call. At ~5s block time, that's ~14 hours. The VictoryNFT has been live for days, so **chunked fetching is required**.

Implement `getLogsPaginated` following the same pattern as `leaderboard.ts` (`CHUNK_SIZE = 5_000`):

```typescript
async function getLogsPaginated(client, args, fromBlock, toBlock, chunkSize = 5_000n) {
  const logs = [];
  for (let from = fromBlock; from <= toBlock; from += chunkSize) {
    const to = from + chunkSize - 1n > toBlock ? toBlock : from + chunkSize - 1n;
    const chunk = await client.getLogs({ ...args, fromBlock: from, toBlock: to });
    logs.push(...chunk);
  }
  return logs;
}
```

Query calls:
```typescript
// My Victories — filtered by player
const myLogs = await getLogsPaginated(client, {
  address: VICTORY_NFT_ADDRESS,
  event: VictoryMintedEvent,
  args: { player: connectedAddress },
}, DEPLOY_BLOCK, latestBlock);

// Hall of Fame — unfiltered
const allLogs = await getLogsPaginated(client, {
  address: VICTORY_NFT_ADDRESS,
  event: VictoryMintedEvent,
}, DEPLOY_BLOCK, latestBlock);
```

### Block timestamp resolution

The `VictoryMinted` event does not include a timestamp. To display the victory date:

1. Collect unique `blockNumber` values from the logs
2. Batch-fetch `getBlock` for each unique blockNumber
3. Map `block.timestamp` (unix seconds) to each log entry
4. Cache the blockNumber→timestamp mapping in-memory for the session (blocks are immutable)

If multiple logs share the same blockNumber, one `getBlock` call covers all of them.

### `DEPLOY_BLOCK`

```typescript
const DEPLOY_BLOCK = 61_250_000n; // VictoryNFT proxy deployed 2026-03-17
```

All `getLogs` queries use this as `fromBlock` to avoid scanning the entire chain. This value is a safe lower bound — the exact deploy tx is within a few hundred blocks of this.

---

## Sorting and Limits

| Section | Sort | Limit |
|---------|------|-------|
| My Victories | `blockNumber` desc (newest first) | No limit (all user victories) |
| Hall of Fame | `blockNumber` desc (newest first) | 10 items |

---

## Loading, Empty, and Error States

| Condition | Display |
|-----------|---------|
| Loading (fetching logs) | Skeleton cards (3 placeholder cards with pulse animation) |
| No wallet connected | "Connect wallet to see your victories" |
| Wallet connected, zero victories | "No victories yet — win in the Arena to earn your first trophy" + CTA to `/arena` |
| Hall of Fame, zero events globally | "No victories recorded yet — be the first!" |
| RPC error (network failure, rate limit) | "Could not load victories — tap to retry" with retry button |

---

## Re-share Behavior

- Each card in "My Victories" has a re-share button
- Re-share navigates to or triggers share for `/victory/[tokenId]`
- Uses the existing `ShareButton` component (`components/ui/share-button.tsx`)
- Share text: reuse `VICTORY_CLAIM_COPY.challengeText(moves, url)` from `editorial.ts`
- Does NOT regenerate metadata, remint, or require wallet connection for the share itself
- The `/victory/[tokenId]` page and OG image already exist and are immutable
- Hall of Fame cards do NOT have re-share buttons (they're other players' victories)

---

## Performance Notes

- `fromBlock = DEPLOY_BLOCK` — never scan from genesis
- Single fetch on mount, no polling or refetch interval
- Block timestamp fetching batched by unique blockNumber (deduped)
- `getBlock` calls can run in parallel via `Promise.all`
- No SSR data fetching — client-side only (depends on wallet state)
- Hall of Fame could be SSR in future, but client-side is fine for v1
- Pagination for My Victories is out of scope — acceptable because early-stage volume is low

---

## File Responsibilities

| File | Responsibility |
|------|----------------|
| `app/trophies/page.tsx` | Route page, metadata, layout shell |
| `components/trophies/trophy-list.tsx` | Renders list of `TrophyCard`s. Accepts `victories: VictoryEntry[]`, `showPlayer: boolean`, `showShare: boolean` |
| `components/trophies/trophy-card.tsx` | Single victory card: difficulty pill, moves, time, date, optional player address, optional re-share |
| `lib/game/victory-events.ts` | `fetchMyVictories(client, player)`, `fetchHallOfFame(client)`, block timestamp resolution, `DEPLOY_BLOCK` constant |

---

## Suggested UI Data Type

```typescript
type VictoryEntry = {
  tokenId: bigint;
  player: string;         // full address
  difficulty: number;     // 1=Easy, 2=Medium, 3=Hard
  totalMoves: number;
  timeMs: number;
  blockNumber: bigint;
  timestamp: number;      // unix seconds, resolved from block
};

// Note: the VictoryMinted event also emits `token` (payment token address)
// and `totalAmount` (fee paid). These are intentionally omitted from VictoryEntry
// because the trophy card UI does not display payment info. If needed later,
// they are available in the raw log args.
```

---

## Entry Points to `/trophies`

- **Persistent dock**: replace the `invite` slot (5th position) with a Trophy icon linking to `/trophies`. The dock keeps its 5-item layout with "Free Play" centered at slot 3.
- **Post-mint success screen**: add "View your trophies →" link in `victory-claim-success.tsx`

---

## Acceptance Criteria

- [ ] `/trophies` route renders on mobile (390px)
- [ ] "My Victories" shows connected user's minted victories, newest first
- [ ] Each personal victory card has a working re-share button
- [ ] "Hall of Fame" shows last 10 global victories with player addresses
- [ ] All three empty states display correctly
- [ ] Victory dates are resolved from block timestamps
- [ ] Roadmap banner visible at bottom: "More coming soon → Tournaments • VIP Passes • Seasonal Rewards"
- [ ] No contract changes
- [ ] No new dependencies beyond what's already in the project
- [ ] Page feels premium and consistent with existing dark fantasy aesthetic
