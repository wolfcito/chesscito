"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Board } from "@/components/board";
import { TutorialPanel } from "@/components/tutorial-panel";
import { recordLocalCompletion } from "@/lib/game/progress";
import type { BoardPosition } from "@/lib/game/types";
import { getPositionLabel } from "@/lib/game/board";
import { rookChallenge } from "@/lib/levels/rook-challenge";
import { rookTutorial } from "@/lib/levels/rook-tutorial";

const pieceCopy: Record<
  string,
  {
    title: string;
    description: string;
    status: string;
    isPlayable: boolean;
  }
> = {
  rook: {
    title: "Torre",
    description: "Primer vertical slice jugable: tablero responsive, coordenadas y movimiento legal de Torre en tablero vacio.",
    status: "Playable MVP",
    isPlayable: true,
  },
  bishop: {
    title: "Alfil",
    description: "Ruta reservada para diagonales. Se implementa despues de cerrar Torre y on-chain proof.",
    status: "Pendiente M4",
    isPlayable: false,
  },
  knight: {
    title: "Caballo",
    description: "Ruta reservada para movimientos en L. No se activa hasta cerrar la ruta critica principal.",
    status: "Pendiente M4",
    isPlayable: false,
  },
};

export default function PlayPiecePage({
  params,
}: {
  params: { piece: string };
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"tutorial" | "challenge" | "success" | "failure">("tutorial");
  const [boardKey, setBoardKey] = useState(0);
  const piece = pieceCopy[params.piece] ?? {
    title: "Pieza desconocida",
    description: "Esta ruta existe para soportar el esquema del juego, pero la pieza aun no esta configurada.",
    status: "Sin configurar",
    isPlayable: false,
  };
  const challengeTarget: BoardPosition = { file: 7, rank: 0 };

  const handleChallengeMove = (position: BoardPosition) => {
    const targetLabel = getPositionLabel(challengeTarget);
    const selectedLabel = getPositionLabel(position);

    if (selectedLabel === targetLabel) {
      const payload = {
        piece: "rook",
        challenge: "capture-with-rooks",
        score: rookChallenge.score,
        status: "success" as const,
        target: targetLabel,
        moves: 1,
        completedAt: new Date().toISOString(),
      };

      recordLocalCompletion(payload);
      setPhase("success");
      router.push(
        `/result?piece=rook&status=success&score=${rookChallenge.score}&target=${targetLabel}&moves=1`
      );
      return;
    }

    setPhase("failure");
  };

  const handleRetry = () => {
    setBoardKey((current) => current + 1);
    setPhase("challenge");
  };

  return (
    <AppShell
      eyebrow="Play"
      title={piece.title}
      description={piece.description}
      secondaryCta={{ href: "/levels", label: "Cambiar pieza" }}
    >
      {piece.isPlayable ? (
        <div className="space-y-4">
          {phase === "tutorial" ? (
            <TutorialPanel
              eyebrow={rookTutorial.eyebrow}
              title={rookTutorial.title}
              description={rookTutorial.description}
              cues={rookTutorial.cues}
              ctaLabel={rookTutorial.practiceLabel}
              onStart={() => setPhase("challenge")}
            />
          ) : null}
          {phase !== "tutorial" ? (
            <div className="space-y-3 rounded-[28px] border border-amber-200 bg-amber-50/80 p-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Challenge
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {rookChallenge.title}
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  {rookChallenge.description}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                Objetivo actual: capturar <span className="font-semibold">{rookChallenge.targetLabel}</span>
              </div>
            </div>
          ) : null}
          <Board
            key={boardKey}
            mode={phase === "tutorial" ? "tutorial" : "practice"}
            targetPosition={phase === "tutorial" ? null : challengeTarget}
            isLocked={phase === "failure"}
            onMove={phase === "challenge" ? handleChallengeMove : undefined}
          />
          {phase === "failure" ? (
            <div className="space-y-3 rounded-[28px] border border-rose-200 bg-rose-50/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">Fallo</p>
              <p className="text-sm leading-6 text-slate-700">
                Esa jugada no capturó el objetivo. Reinicia el tablero y prueba otra trayectoria recta.
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white sm:w-auto"
              >
                Retry
              </button>
            </div>
          ) : null}
          {phase === "success" ? (
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Success</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Captura completada. Redirigiendo al resultado local para preparar el submit on-chain.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {piece.status}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            El board renderer jugable se activa primero para Torre. Esta pieza sigue reservada para un slice posterior.
          </p>
        </div>
      )}
    </AppShell>
  );
}
