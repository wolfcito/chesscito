import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";

import { readPlayerVictories, tryRefresh } from "@/lib/server/hof-index";
import type { IndexedVictoryRow } from "@/lib/server/hof-index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type MyVictoryRow = Omit<IndexedVictoryRow, "id">;

export async function GET(request: NextRequest) {
  const player = request.nextUrl.searchParams.get("player");

  if (!player || !isAddress(player)) {
    return NextResponse.json(
      { error: "Missing or invalid player address" },
      { status: 400 }
    );
  }

  const metrics = await tryRefresh();

  const { rows, lastBlock } = await readPlayerVictories(player);

  const body: MyVictoryRow[] = rows.map(({ id: _, ...rest }) => rest);

  const stale = metrics.staleServed || metrics.refreshFailed;

  console.info(
    `[hof:refresh] player=${player.slice(0, 10)}... blocksScanned=${metrics.blocksScanned} newEvents=${metrics.newEventsFound} duration=${metrics.scanDurationMs}ms stale=${stale}`
  );

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      "X-HoF-Stale": String(stale),
      "X-HoF-Indexed-Through": String(lastBlock),
    },
  });
}
