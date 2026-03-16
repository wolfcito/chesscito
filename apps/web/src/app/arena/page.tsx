"use client";

import { useRouter } from "next/navigation";
import { useChessGame } from "@/lib/game/use-chess-game";
import { ArenaBoard } from "@/components/arena/arena-board";
import { DifficultySelector } from "@/components/arena/difficulty-selector";
import { ArenaHud } from "@/components/arena/arena-hud";
import { PromotionOverlay } from "@/components/arena/promotion-overlay";
import { ArenaEndState } from "@/components/arena/arena-end-state";
import { ARENA_COPY } from "@/lib/content/editorial";

export default function ArenaPage() {
  const router = useRouter();
  const game = useChessGame();

  const isEndState = ["checkmate", "stalemate", "draw", "resigned"].includes(game.status);

  // After checkmate, chess.js turn belongs to the mated side.
  // If black to move (" b ") → black is mated → player (white) wins.
  const isPlayerWin = game.status === "checkmate" && game.fen.includes(" b ");

  const handleBackToHub = () => router.push("/play-hub");

  // Loading state
  if (game.status === "loading") {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a1628]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm text-white/60">{ARENA_COPY.preparingAi}</p>
        </div>
      </main>
    );
  }

  // Difficulty selection
  if (game.status === "selecting") {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a1628]">
        <DifficultySelector
          selected={game.difficulty}
          onSelect={game.setDifficulty}
          onStart={game.startGame}
        />
      </main>
    );
  }

  // Playing + end states
  return (
    <main className="flex min-h-[100dvh] flex-col items-center bg-[#0a1628]">
      <div className="flex w-full max-w-[var(--app-max-width,390px)] flex-col">
        <ArenaHud difficulty={game.difficulty} isThinking={game.isThinking} />

        <div className="relative w-full">
          <ArenaBoard
            pieces={game.pieces}
            selectedSquare={game.selectedSquare}
            legalMoves={game.legalMoves}
            lastMove={game.lastMove}
            checkSquare={game.checkSquare}
            isLocked={game.isThinking || isEndState}
            onSquareClick={game.selectSquare}
          />
          {game.pendingPromotion && (
            <PromotionOverlay onSelect={game.promoteWith} />
          )}
        </div>

        {/* Actions bar */}
        {!isEndState && (
          <div className="flex items-center justify-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={game.resign}
              className="rounded-xl bg-white/10 px-5 py-2 text-sm font-semibold text-white/70 transition-all hover:bg-white/20 active:scale-95"
            >
              {ARENA_COPY.resign}
            </button>
          </div>
        )}
      </div>

      {isEndState && (
        <ArenaEndState
          status={game.status}
          isPlayerWin={isPlayerWin}
          onPlayAgain={game.reset}
          onBackToHub={handleBackToHub}
        />
      )}
    </main>
  );
}
