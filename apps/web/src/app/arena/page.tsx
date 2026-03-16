"use client";

import { ArenaBoard } from "@/components/arena/arena-board";
import { fenToPieces } from "@/lib/game/arena-utils";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function ArenaPage() {
  const pieces = fenToPieces(START_FEN);
  return (
    <main className="flex min-h-[100dvh] flex-col items-center bg-[#0a1628] p-4">
      <h1 className="mb-4 text-xl font-bold text-white">Tint Spike</h1>
      <div className="w-full max-w-[390px]">
        <ArenaBoard
          pieces={pieces}
          selectedSquare={null}
          legalMoves={[]}
          lastMove={null}
          checkSquare={null}
          isLocked={false}
          onSquareClick={() => {}}
        />
      </div>
    </main>
  );
}
