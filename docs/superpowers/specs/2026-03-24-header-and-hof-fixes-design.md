# Header Button Fix + Hall of Rooks Rewrite

**Date:** 2026-03-24
**Status:** Draft

## Problem

Two issues affecting mobile UX on MiniPay:

1. **Header 3-dot menu** — `MoreHorizontal` icon at 18px with 30% opacity is nearly invisible and hard to tap on mobile
2. **Hall of Rooks crashes** — the `/trophies` page times out because the backend does incremental RPC log scanning (chunks of 50K blocks) with Redis sorted sets. Cold starts or expired Redis keys trigger a full re-scan that exceeds Vercel's 10s function timeout

## Fix 1: Header More Button

### Current state

`apps/web/src/app/page.tsx` lines 789-797:

```tsx
<Link
  href="/about"
  className="flex h-11 w-11 items-center justify-center text-cyan-300/50 transition hover:text-cyan-50"
  aria-label="More options"
>
  <MoreHorizontal size={18} />
</Link>
```

Issues: `MoreHorizontal` at 18px is tiny; `cyan-300/50` (30% effective opacity on dark bg) is nearly invisible; no background affordance tells the user it's tappable.

### Design

Replace with `MoreVertical` (standard mobile "more" pattern) inside a pill with translucent background:

```tsx
<Link
  href="/about"
  className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-cyan-500/10 text-cyan-300/80 transition hover:text-cyan-50"
  aria-label="More options"
>
  <MoreVertical size={20} strokeWidth={2.5} />
</Link>
```

Changes:
- **Icon:** `MoreHorizontal` → `MoreVertical` (vertical dots = universal "more" in mobile)
- **Size:** 18px → 20px, `strokeWidth` 2 → 2.5
- **Color:** `text-cyan-300/50` → `text-cyan-300/80` (much more visible)
- **Background:** add `bg-cyan-500/10 rounded-[10px]` (translucent pill = tappable affordance)
- **Dimensions:** `h-11 w-11` → `h-10 w-10` (40px visual, still above 44px touch target with padding from parent `gap-2`)
- **Import:** `MoreHorizontal` → `MoreVertical` from lucide-react

### Files changed

| File | Change |
|------|--------|
| `apps/web/src/app/page.tsx` | Replace `MoreHorizontal` import with `MoreVertical`; update JSX block (lines 789-797) |

## Fix 2: Hall of Rooks — Blockscout API + Redis Cache

### Current architecture (broken)

```
[Client] → GET /api/hall-of-fame
         → tryRefresh() — acquires Redis lock, scans RPC logs in 50K-block chunks,
           resolves block timestamps via getBlock(), writes Redis sorted sets
         → readHofEntries() — reads top 10 from Redis sorted set
```

Failure modes:
- Cold start / expired keys → scans ~1.2M blocks → exceeds 10s Vercel timeout
- `getBlock()` N+1 calls for timestamps amplify latency
- Redis sorted sets with JSON-stringified members are fragile (dedup by canonical JSON)
- Background scan continues after timeout but results never persist if it also fails
- Backfill script (`scripts/backfill-hof.ts`) required for bootstrap — manual step that gets forgotten

### New architecture

```
[Client] → GET /api/hall-of-fame → Redis cache?
                                     ├─ HIT (TTL valid) → return cached JSON
                                     └─ MISS → fetchBlockscoutLogs() → decode → cache → return

[Client] → GET /api/my-victories?player=0x... → Redis cache?
                                                  ├─ HIT → return
                                                  └─ MISS → fetchBlockscoutLogs() → filter by player → cache → return
```

**Data source:** Celo Blockscout public API (no API key required):

```
GET https://celo.blockscout.com/api
  ?module=logs
  &action=getLogs
  &address=0x0eE22F830a99e7a67079018670711C0F94Abeeb0
  &fromBlock=61250000
  &toBlock=latest
```

Returns all contract logs with `timeStamp` included — eliminates both the chunked RPC scan and the N+1 `getBlock()` calls.

### Data flow

1. API route checks Redis for cached response (`hof:v2:all` or `hof:v2:player:{addr}`)
2. On cache miss: single `fetch()` to Blockscout (~300ms)
3. Decode `VictoryMinted` events from topics/data using `decodeEventLog` (viem)
4. Sort by block number descending
5. For hall-of-fame: return top 10; for my-victories: filter by player address
6. Cache result in Redis as JSON string with 60s TTL
7. Return response

### New module: `lib/server/hof-blockscout.ts`

Exports:

```typescript
type VictoryRow = {
  tokenId: string;
  player: string;
  difficulty: number;
  totalMoves: number;
  timeMs: number;
  timestamp: number;
};

/** Fetch all VictoryMinted events from Blockscout, decode, sort desc. */
export async function fetchAllVictories(): Promise<VictoryRow[]>;

/** Cached read: hall of fame (top 10). */
export async function getHallOfFame(): Promise<VictoryRow[]>;

/** Cached read: player's victories. */
export async function getPlayerVictories(player: string): Promise<VictoryRow[]>;
```

Internal implementation:
- `fetchAllVictories()` — fetch Blockscout, decode events, sort by blockNumber desc
- `getHallOfFame()` — check Redis `hof:v2:all` → miss → `fetchAllVictories().slice(0, 10)` → cache 60s
- `getPlayerVictories(player)` — check Redis `hof:v2:player:{addr}` → miss → `fetchAllVictories().filter(...)` → cache 60s
- Blockscout fetch timeout: 5 seconds
- If Blockscout fails: return `[]` (API routes add `X-HoF-Stale: true` header)
- If Redis fails: bypass cache, fetch Blockscout directly

### Redis keys (new)

```typescript
export const HOF_V2_KEYS = {
  all: "hof:v2:all",               // JSON string, TTL 60s
  player: (addr: string) =>
    `hof:v2:player:${addr.toLowerCase()}`,  // JSON string, TTL 60s
} as const;
```

### API routes (simplified)

**`GET /api/hall-of-fame`:**
```typescript
export async function GET() {
  const rows = await getHallOfFame();
  return NextResponse.json(rows, {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" },
  });
}
```

**`GET /api/my-victories?player=0x...`:**
```typescript
export async function GET(request: NextRequest) {
  const player = request.nextUrl.searchParams.get("player");
  if (!player || !isAddress(player)) return NextResponse.json({ error: "..." }, { status: 400 });
  const rows = await getPlayerVictories(player);
  return NextResponse.json(rows, {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
  });
}
```

### Files changed

| File | Change |
|------|--------|
| `apps/web/src/lib/server/hof-blockscout.ts` | **New** — Blockscout fetch + decode + Redis cache |
| `apps/web/src/lib/server/hof-index.ts` | **Delete** — replaced by hof-blockscout.ts |
| `apps/web/src/lib/coach/redis-keys.ts` | Replace `HOF_KEYS` with `HOF_V2_KEYS` |
| `apps/web/src/app/api/hall-of-fame/route.ts` | Simplify: import from hof-blockscout, remove tryRefresh/metrics |
| `apps/web/src/app/api/my-victories/route.ts` | Simplify: import from hof-blockscout, remove tryRefresh/metrics |
| `apps/web/scripts/backfill-hof.ts` | **Delete** — no longer needed |
| `apps/web/src/app/trophies/page.tsx` | No changes (same API contract) |
| `apps/web/src/app/trophies/error.tsx` | No changes |
| `apps/web/src/components/trophies/*` | No changes |

### Scaling plan

| Scale | Solution |
|-------|----------|
| 0–1,000 events | Blockscout API + Redis cache (this spec) |
| 1,000+ events | Migrate to The Graph subgraph or Supabase Postgres |

Blockscout paginates at 1,000 logs per request. When the contract approaches this limit, implement pagination or migrate to a dedicated indexer.

## Out of scope

- Trophies page UI/layout changes
- Trophies page navigation pattern (stays as separate `/trophies` route)
- Cleaning up old Redis keys from v1 (they'll expire naturally)
- Pagination for 1,000+ events (future tier 2)
