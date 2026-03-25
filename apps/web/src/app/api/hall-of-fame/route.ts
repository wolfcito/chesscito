import { NextResponse } from "next/server";

import { readHofEntries, tryRefresh } from "@/lib/server/hof-index";
import type { IndexedVictoryRow } from "@/lib/server/hof-index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type HallOfFameRow = Omit<IndexedVictoryRow, "id">;

export async function GET() {
  const metrics = await tryRefresh();

  const { rows, lastBlock } = await readHofEntries();

  // Strip internal `id` field from response
  const body: HallOfFameRow[] = rows.map(({ id: _, ...rest }) => rest);

  const stale = metrics.staleServed || metrics.refreshFailed;

  console.info(
    `[hof:refresh] blocksScanned=${metrics.blocksScanned} newEvents=${metrics.newEventsFound} duration=${metrics.scanDurationMs}ms indexed=${metrics.indexedThroughBlock} stale=${stale}`
  );

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
      "X-HoF-Stale": String(stale),
      "X-HoF-Indexed-Through": String(lastBlock),
    },
  });
}
