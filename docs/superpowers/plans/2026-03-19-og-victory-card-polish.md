# OG Victory Card — Premium Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the OG victory card from functional-minimal to premium dark fantasy with route hardening.

**Architecture:** Single-file restyle of `app/api/og/victory/[id]/route.tsx` — add Cinzel font (local TTF), king SVG watermark (data URI), input validation, cache headers, error card, and value clamping. No new routes, no new dependencies.

**Tech Stack:** Next.js `ImageResponse` (Satori), viem, edge runtime

**Spec:** `docs/superpowers/specs/2026-03-19-og-victory-card-polish-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/src/app/api/og/victory/[id]/route.tsx` | Modify | OG image route — all visual + hardening changes |
| `apps/web/src/assets/fonts/Cinzel-Bold.ttf` | Create | Cinzel Bold font file (OFL licensed) |
| `apps/web/src/assets/fonts/OFL-Cinzel.txt` | Create | SIL Open Font License (legally required) |
| `apps/web/src/lib/og/king-svg.ts` | Create | King silhouette data URI constant (keeps route file focused) |
| `apps/web/src/lib/og/og-utils.ts` | Create | Shared helpers: `formatTime`, `clampMoves`, `clampTime`, `truncateId`, `formatPlayer` |
| `apps/web/src/lib/og/__tests__/og-utils.test.ts` | Create | Unit tests for og-utils |

---

### Task 1: Add font assets (Cinzel Bold + OFL license)

**Files:**
- Create: `apps/web/src/assets/fonts/Cinzel-Bold.ttf`
- Create: `apps/web/src/assets/fonts/OFL-Cinzel.txt`

- [ ] **Step 1: Download Cinzel Bold TTF**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && mkdir -p apps/web/src/assets/fonts && curl -L -o apps/web/src/assets/fonts/Cinzel-Bold.ttf "https://github.com/google/fonts/raw/main/ofl/cinzel/static/Cinzel-Bold.ttf"
```

Note: Uses the **static single-weight** Cinzel-Bold.ttf — more reliable with Satori than the variable-weight font. If unavailable, fall back to the variable font URL: `ofl/cinzel/Cinzel%5Bwght%5D.ttf`.

- [ ] **Step 2: Add OFL license file**

Create `apps/web/src/assets/fonts/OFL-Cinzel.txt` with the standard SIL Open Font License text. Source from: https://github.com/google/fonts/blob/main/ofl/cinzel/OFL.txt

```bash
curl -L -o apps/web/src/assets/fonts/OFL-Cinzel.txt "https://github.com/google/fonts/raw/main/ofl/cinzel/OFL.txt"
```

- [ ] **Step 3: Verify files exist**

```bash
ls -la apps/web/src/assets/fonts/
```

Expected: `Cinzel-Bold.ttf` (~100-200KB) and `OFL-Cinzel.txt`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/assets/fonts/
git commit -m "chore: add Cinzel Bold font with OFL license (#59)"
```

---

### Task 2: Extract OG utility functions with tests

**Files:**
- Create: `apps/web/src/lib/og/og-utils.ts`
- Create: `apps/web/src/lib/og/__tests__/og-utils.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/lib/og/__tests__/og-utils.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatTime,
  clampMoves,
  clampTime,
  truncateId,
  formatPlayer,
} from "../og-utils.js";

describe("formatTime", () => {
  it("formats seconds-only time", () => {
    assert.equal(formatTime(16000), "0:16");
  });
  it("formats minutes and seconds", () => {
    assert.equal(formatTime(125000), "2:05");
  });
  it("formats zero", () => {
    assert.equal(formatTime(0), "0:00");
  });
  it("formats exactly 1 minute", () => {
    assert.equal(formatTime(60000), "1:00");
  });
});

describe("clampMoves", () => {
  it("returns number as string for normal values", () => {
    assert.equal(clampMoves(7), "7");
  });
  it("returns 999 as string", () => {
    assert.equal(clampMoves(999), "999");
  });
  it("clamps values above 999", () => {
    assert.equal(clampMoves(1000), "999+");
  });
  it("clamps extreme values", () => {
    assert.equal(clampMoves(65535), "999+");
  });
});

describe("clampTime", () => {
  it("returns normal time as-is", () => {
    assert.equal(clampTime(16000), "0:16");
  });
  it("clamps time above 99:59", () => {
    // 99:59 = 5999 seconds = 5999000 ms
    assert.equal(clampTime(5999000), "99:59");
  });
  it("clamps extreme time", () => {
    assert.equal(clampTime(4294967295), "99:59");
  });
  it("returns 99:59 boundary exactly", () => {
    assert.equal(clampTime(5999000), "99:59");
  });
  it("clamps just over boundary", () => {
    assert.equal(clampTime(6000000), "99:59");
  });
});

describe("truncateId", () => {
  it("returns short IDs unchanged", () => {
    assert.equal(truncateId("42"), "42");
  });
  it("returns 10-digit IDs unchanged", () => {
    assert.equal(truncateId("1234567890"), "1234567890");
  });
  it("truncates IDs over 10 digits", () => {
    assert.equal(truncateId("12345678901"), "1234567890\u2026");
  });
  it("truncates very long IDs", () => {
    assert.equal(truncateId("123456789012345678901234567890"), "1234567890\u2026");
  });
});

describe("formatPlayer", () => {
  it("formats full address", () => {
    assert.equal(
      formatPlayer("0xA3b2C1d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8A99F"),
      "0xA3b2\u2026A99F"
    );
  });
  it("handles short address gracefully", () => {
    assert.equal(formatPlayer("0x1234"), "0x1234");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/web && tsc -p tsconfig.test-og.json 2>&1 | head -5
```

Expected: compilation error — `og-utils` module does not exist. (Requires `tsconfig.test-og.json` from Step 4 — create that file first if running steps out of order.)

- [ ] **Step 3: Write implementation**

Create `apps/web/src/lib/og/og-utils.ts`:

```typescript
/** Format milliseconds to m:ss display */
export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0
    ? `${m}:${String(sec).padStart(2, "0")}`
    : `0:${String(sec).padStart(2, "0")}`;
}

/** Clamp moves to 999+ for display (R8) */
export function clampMoves(n: number): string {
  return n > 999 ? "999+" : String(n);
}

/** Clamp time to 99:59 for display (R8) */
export function clampTime(ms: number): string {
  const MAX_MS = 5999000; // 99:59
  return formatTime(Math.min(ms, MAX_MS));
}

/** Truncate token ID to 10 digits for display (R11) */
export function truncateId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 10)}\u2026` : id;
}

/** Format player address as 0xABCD…1234 */
export function formatPlayer(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}
```

- [ ] **Step 4: Add test script to package.json**

Add to `apps/web/package.json` scripts:

```json
"test:og": "rm -rf .tmp/og-tests && tsc -p tsconfig.test-og.json && node --test .tmp/og-tests/lib/og/__tests__/og-utils.test.js && rm -rf .tmp/og-tests"
```

Update `"test"` to include `test:og`:

```json
"test": "npm run test:server && npm run test:game && npm run test:og"
```

Create `apps/web/tsconfig.test-og.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": ".tmp/og-tests",
    "rootDir": "src",
    "target": "es2020",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "noEmit": false,
    "paths": {}
  },
  "include": ["src/lib/og/**/*.ts"]
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/web && npm run test:og
```

Expected: all 14 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/og/ apps/web/tsconfig.test-og.json apps/web/package.json
git commit -m "feat(og): extract og-utils with value clamping and formatting (#59)

14 unit tests for formatTime, clampMoves, clampTime, truncateId, formatPlayer."
```

---

### Task 3: Create king SVG data URI constant

**Files:**
- Create: `apps/web/src/lib/og/king-svg.ts`

- [ ] **Step 1: Create king SVG module**

Create `apps/web/src/lib/og/king-svg.ts`:

```typescript
/**
 * Chess king silhouette as base64-encoded SVG data URI.
 * Used as atmospheric watermark in OG victory card.
 * Opacity controlled by the consumer (0.04–0.05).
 *
 * The SVG is a simple crown/king silhouette — intentionally minimal
 * for Satori compatibility. If Satori fails to render SVG data URIs,
 * replace with a PNG data URI (see spec R9 fallback plan).
 */

const KING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" fill="#5eead4">
  <path d="M50 5 L55 20 L65 10 L60 25 L75 18 L65 30 L80 28 L68 38 L78 42 L32 42 L22 38 L20 28 L35 30 L25 18 L40 25 L35 10 L45 20 Z"/>
  <rect x="28" y="42" width="44" height="8" rx="2"/>
  <path d="M25 50 L75 50 L72 90 L28 90 Z"/>
  <rect x="22" y="90" width="56" height="10" rx="3"/>
  <rect x="18" y="100" width="64" height="12" rx="4"/>
</svg>`;

export const KING_DATA_URI = `data:image/svg+xml;base64,${typeof btoa !== "undefined" ? btoa(KING_SVG) : Buffer.from(KING_SVG).toString("base64")}`;
```

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/web && npx tsc --noEmit src/lib/og/king-svg.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/og/king-svg.ts
git commit -m "feat(og): add king silhouette SVG data URI for OG watermark (#59)"
```

---

### Task 4: Rewrite OG route — hardening layer

**Files:**
- Modify: `apps/web/src/app/api/og/victory/[id]/route.tsx`

This task adds input validation, cache headers, error card, and client reuse — without changing the visual design yet. The card should look the same after this step, but be hardened.

- [ ] **Step 1: Rewrite route with hardening**

Replace the full content of `apps/web/src/app/api/og/victory/[id]/route.tsx`:

```typescript
import { ImageResponse } from "next/og";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import { victoryAbi } from "@/lib/contracts/victory";
import { clampMoves, clampTime, formatPlayer, truncateId } from "@/lib/og/og-utils";

export const runtime = "edge";

const W = 1200;
const H = 630;
const PAD = 80;

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "EASY",
  2: "MEDIUM",
  3: "HARD",
};

/* ── Module-scope client (R5) ── */
const contractAddress = process.env
  .NEXT_PUBLIC_VICTORY_NFT_ADDRESS as `0x${string}` | undefined;

const client = contractAddress
  ? createPublicClient({ chain: celo, transport: http() })
  : null;

/* ── Shared styles ── */
const BG = "linear-gradient(160deg, #0a1424 0%, #0b1628 40%, #0f1d35 70%, #0a1424 100%)";

const SUCCESS_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  "CDN-Cache-Control": "public, s-maxage=86400",
};

const ERROR_HEADERS = {
  "Cache-Control": "no-store",
};

/* ── Error card ── */
function errorCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#e4f6fb",
          background: BG,
          padding: PAD,
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "rgba(94,234,212,0.6)", marginBottom: 16 }}>
          Victory not found
        </div>
        <div style={{ display: "flex", fontSize: 16, color: "rgba(160,205,225,0.4)" }}>
          This victory may not exist yet
        </div>
        <div style={{ display: "flex", fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(20,184,166,0.30)", marginTop: 40 }}>
          CHESSCITO
        </div>
      </div>
    ),
    { width: W, height: H, status: 404, headers: ERROR_HEADERS },
  );
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  /* ── Input validation (R1) ── */
  const raw = params.id;
  if (!raw || !/^\d{1,78}$/.test(raw)) {
    return new Response("Invalid token ID", { status: 400 });
  }
  const tokenId = BigInt(raw);

  /* ── Fetch onchain data ── */
  if (!client || !contractAddress) return errorCard();

  let moves: string;
  let time: string;
  let difficulty: string;
  let player: string;

  try {
    const [victoryData, owner] = await Promise.all([
      client.readContract({
        address: contractAddress,
        abi: victoryAbi,
        functionName: "victories",
        args: [tokenId],
      }),
      client.readContract({
        address: contractAddress,
        abi: victoryAbi,
        functionName: "ownerOf",
        args: [tokenId],
      }),
    ]);

    const [diff, totalMoves, timeMs] = victoryData as [number, number, number];
    moves = clampMoves(totalMoves);
    time = clampTime(timeMs);
    difficulty = DIFFICULTY_LABEL[diff] ?? "EASY";
    player = formatPlayer(owner as string);
  } catch {
    return errorCard();
  }

  const displayId = truncateId(raw);

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#e4f6fb",
          background: BG,
          padding: PAD,
          position: "relative",
        }}
      >
        {/* Headline */}
        <div style={{ display: "flex", fontSize: 72, fontWeight: 900, letterSpacing: "0.06em", color: "#5eead4", lineHeight: 1, marginBottom: 20 }}>
          CHECKMATE
        </div>

        {/* Performance */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700, color: "#f5f5f5", letterSpacing: "0.04em", marginBottom: 20 }}>
          {`${moves} MOVES \u2022 ${time}`}
        </div>

        {/* Difficulty pill */}
        <div style={{ display: "flex", padding: "6px 24px", borderRadius: 20, border: "1px solid rgba(160,205,225,0.15)", background: "rgba(255,255,255,0.04)", fontSize: 14, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(160,205,225,0.5)", marginBottom: 32 }}>
          {difficulty}
        </div>

        {/* Challenge line */}
        <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#fbbf24", letterSpacing: "0.02em", marginBottom: 28 }}>
          Can you beat this?
        </div>

        {/* Player + Victory ID */}
        <div style={{ display: "flex", fontSize: 16, fontWeight: 400, color: "rgba(160,205,225,0.4)", marginBottom: 8 }}>
          {`Victory #${displayId} \u2022 by ${player}`}
        </div>

        {/* Brand */}
        <div style={{ display: "flex", fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(20,184,166,0.35)" }}>
          CHESSCITO
        </div>
      </div>
    ),
    { width: W, height: H, headers: SUCCESS_HEADERS },
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run existing tests to verify no regressions**

```bash
cd apps/web && npm test
```

Expected: all tests pass.

- [ ] **Step 4: Manual smoke test**

```bash
cd apps/web && npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/og/victory/abc"
# Expected: 400
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/og/victory/1"
# Expected: 200 (or 404 if token 1 doesn't exist — both are correct)
kill %1
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/og/victory/
git commit -m "fix(og): harden OG route — input validation, cache headers, error card (#59)

R1: reject invalid token IDs (400)
R2: Cache-Control s-maxage=86400 on success
R3: 'Victory not found' card instead of fake stats (404)
R5: module-scope client reuse
R8: value clamping via og-utils
R11: ID truncation"
```

---

### Task 5: Apply premium visual design

**Files:**
- Modify: `apps/web/src/app/api/og/victory/[id]/route.tsx`

This task applies the full visual polish: Cinzel font, king watermark, radial gradient, separator, teal glow, updated spacing.

- [ ] **Step 1: Add font loading and king import at top of route**

Add after existing imports:

```typescript
import { KING_DATA_URI } from "@/lib/og/king-svg";
```

Add font loading constant at module scope:

```typescript
const CINZEL_FONT_URL = new URL(
  "../../../../../assets/fonts/Cinzel-Bold.ttf",
  import.meta.url,
);
```

- [ ] **Step 2: Add font loading in GET handler**

At the top of the `GET` function, after input validation and before onchain fetch:

```typescript
let cinzelData: ArrayBuffer | null = null;
try {
  const res = await fetch(CINZEL_FONT_URL);
  if (!res.ok) throw new Error(`Font fetch ${res.status}`);
  cinzelData = await res.arrayBuffer();
} catch {
  /* system serif fallback — card still renders */
}
```

- [ ] **Step 3: Update background to radial gradient**

Replace the `BG` constant:

```typescript
const BG = "radial-gradient(ellipse at 65% 50%, #0b1628 0%, #0a1424 70%)";
```

- [ ] **Step 4: Update the success card JSX**

Replace the entire success `ImageResponse` JSX with the premium layout:

```typescript
return new ImageResponse(
  (
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        color: "#e4f6fb",
        background: BG,
        padding: PAD,
        position: "relative",
      }}
    >
      {/* Teal atmosphere glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "30%",
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(94,234,212,0.03) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* King watermark (R9 — data URI img for Satori compat) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={KING_DATA_URI}
        alt=""
        width={280}
        height={336}
        style={{
          position: "absolute",
          right: 100,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.045,
        }}
      />

      {/* Headline */}
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          fontFamily: cinzelData ? "Cinzel" : "serif",
          letterSpacing: "0.08em",
          color: "#5eead4",
          textShadow: "0 0 30px rgba(94,234,212,0.20)",
          lineHeight: 1,
          marginBottom: 20,
        }}
      >
        CHECKMATE
      </div>

      {/* Separator */}
      <div
        style={{
          display: "flex",
          width: 200,
          height: 1,
          background: "rgba(94,234,212,0.15)",
          marginBottom: 20,
        }}
      />

      {/* Performance */}
      <div
        style={{
          display: "flex",
          fontSize: 38,
          fontWeight: 700,
          color: "#f5f5f5",
          letterSpacing: "0.04em",
          marginBottom: 20,
        }}
      >
        {`${moves} MOVES \u2022 ${time}`}
      </div>

      {/* Difficulty pill */}
      <div
        style={{
          display: "flex",
          padding: "6px 24px",
          borderRadius: 20,
          border: "1px solid rgba(160,205,225,0.12)",
          background: "rgba(255,255,255,0.03)",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "rgba(160,205,225,0.45)",
          marginBottom: 28,
        }}
      >
        {difficulty}
      </div>

      {/* Challenge line */}
      <div
        style={{
          display: "flex",
          fontSize: 28,
          fontWeight: 600,
          color: "#fbbf24",
          letterSpacing: "0.02em",
          marginBottom: 28,
        }}
      >
        Can you beat this?
      </div>

      {/* Identity */}
      <div
        style={{
          display: "flex",
          fontSize: 16,
          fontWeight: 400,
          color: "rgba(160,205,225,0.4)",
          marginBottom: 8,
        }}
      >
        {`Victory #${displayId} \u2022 by ${player}`}
      </div>

      {/* Brand (R10 — flex-aligned, not absolute) */}
      <div
        style={{
          display: "flex",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.15em",
          color: "rgba(20,184,166,0.30)",
          alignSelf: "flex-end",
        }}
      >
        CHESSCITO
      </div>
    </div>
  ),
  {
    width: W,
    height: H,
    headers: SUCCESS_HEADERS,
    ...(cinzelData
      ? {
          fonts: [
            {
              name: "Cinzel",
              data: cinzelData,
              weight: 700 as const,
              style: "normal" as const,
            },
          ],
        }
      : {}),
  },
);
```

- [ ] **Step 5: Type-check and run tests**

```bash
cd apps/web && npx tsc --noEmit && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 6: Local visual smoke test**

```bash
cd apps/web && npm run dev &
sleep 3
# Open in browser: http://localhost:3000/api/og/victory/1
# Verify: Cinzel headline, king watermark, radial gradient, separator, correct spacing
kill %1
```

Check visually:
- Headline in Cinzel (serif) not sans-serif
- King silhouette faintly visible on right side
- Teal separator line between headline and stats
- Brand right-aligned
- 80px safe zone respected

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/api/og/victory/
git commit -m "style(og): premium visual polish — Cinzel font, king watermark, radial glow (#59)

Cinzel Bold headline, king SVG watermark (0.045 opacity), radial gradient
background, teal separator, updated spacing with 80px safe zones."
```

---

### Task 6: Vercel preview validation

**Files:** None (testing only)

This is the mandatory compatibility gate from the spec. Deploy to Vercel preview and test on real platforms.

- [ ] **Step 1: Push branch for Vercel preview**

```bash
git push origin main
```

Or if working on a feature branch:

```bash
git checkout -b feat/og-card-polish
git push -u origin feat/og-card-polish
```

- [ ] **Step 2: Font compatibility gate**

Open Vercel preview URL: `{preview-url}/api/og/victory/1`

Verify:
- [ ] Headline renders in Cinzel serif (not system sans-serif)
- [ ] If Cinzel fails → fall back: replace `Cinzel-Bold.ttf` with Inter Bold, re-deploy

- [ ] **Step 3: King SVG gate**

Same URL — verify:
- [ ] King silhouette faintly visible on right side at ~0.045 opacity
- [ ] If SVG broken → fall back: convert to PNG data URI per spec R9

- [ ] **Step 4: Hardening validation**

```bash
PREVIEW="https://your-preview-url"
# Invalid ID → 400
curl -s -o /dev/null -w "%{http_code}" "$PREVIEW/api/og/victory/abc"
# Non-existent token → 404 with error card
curl -s -o /dev/null -w "%{http_code}" "$PREVIEW/api/og/victory/999999"
# Valid token → 200 with cache headers
curl -s -D - "$PREVIEW/api/og/victory/1" -o /dev/null 2>&1 | grep -i cache-control
```

- [ ] **Step 5: Real-world platform validation (mandatory)**

Share a victory URL on each platform and verify preview:

- [ ] **WhatsApp**: send `{preview-url}/victory/1` in a chat — verify preview card is strong and legible
- [ ] **X (Twitter)**: paste URL in draft tweet or use [Twitter Card Validator](https://cards-dev.twitter.com/validator) — verify `summary_large_image` card
- [ ] **Facebook/Messenger** (optional): paste URL and check

If any platform shows weak/illegible preview → adjust and re-deploy before merging.

- [ ] **Step 6: Document results**

If any fallback was needed (font or SVG), commit the change:

```bash
git add -A && git commit -m "fix(og): apply [font/SVG] fallback after Vercel preview validation (#59)"
```

---

## Task Dependency Graph

```
Task 1 (fonts) ──┐
                  ├── Task 4 (hardening) ── Task 5 (visual) ── Task 6 (validation)
Task 2 (utils) ──┤
Task 3 (king) ───┘
```

Tasks 1, 2, 3 are independent and can run in parallel.
Task 4 depends on Task 2 (imports og-utils).
Task 5 depends on Tasks 1, 3, 4 (imports font + king + hardened route).
Task 6 depends on Task 5 (needs deployed code).
