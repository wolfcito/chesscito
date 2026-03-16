/// <reference lib="webworker" />

// This file runs as a Web Worker.
// It loads Stockfish WASM and communicates via postMessage.

type SearchMessage = {
  type: "search";
  fen: string;
  difficulty: "easy" | "medium" | "hard";
};

type InMessage = SearchMessage | { type: "init" };

type OutMessage =
  | { type: "ready" }
  | { type: "bestmove"; move: string }
  | { type: "error"; message: string };

const DIFFICULTY_CONFIG = {
  easy: { depth: 2, skillLevel: 0, elo: 400 },
  medium: { depth: 8, skillLevel: 10, elo: 1200 },
  hard: { depth: 15, skillLevel: 20, elo: 2000 },
} as const;

let engineReady = false;
let resolveMove: ((move: string) => void) | null = null;

function postOut(msg: OutMessage) {
  self.postMessage(msg);
}

function sendUCI(cmd: string) {
  // lila-stockfish-web exposes the engine via self.postMessage to the WASM thread
  // But since we load via importScripts, the engine listens on the global scope
  (self as unknown as { postMessage(msg: string): void }).postMessage(cmd);
}

function handleLine(line: string) {
  if (line === "uciok") {
    sendUCI("isready");
  } else if (line === "readyok") {
    if (!engineReady) {
      engineReady = true;
      postOut({ type: "ready" });
    }
  } else if (line.startsWith("bestmove")) {
    const move = line.split(" ")[1];
    if (move && resolveMove) {
      const cb = resolveMove;
      resolveMove = null;
      cb(move);
    }
  }
}

function initEngine() {
  try {
    // Load Stockfish from public/engines/
    // NOTE: importScripts is valid in Worker context (not in main thread tsconfig)
    // The /// <reference lib="webworker" /> pragma above provides the Worker types.
    importScripts("/engines/sf171-79.js");

    // lila-stockfish-web creates a Stockfish factory on the global scope
    // The exact API depends on the build variant
    const sf = (self as any).Stockfish;

    if (typeof sf === "function") {
      // Factory pattern — call it to get the engine instance
      const engine = sf();

      if (engine && typeof engine.addMessageListener === "function") {
        engine.addMessageListener((line: string) => handleLine(line));
        // Override sendUCI to use the engine's postMessage
        (globalThis as any).__sfEngine = engine;
        engine.postMessage("uci");
      } else if (engine && typeof engine.then === "function") {
        // Promise-based factory
        engine.then((e: any) => {
          if (e.addMessageListener) {
            e.addMessageListener((line: string) => handleLine(line));
            (globalThis as any).__sfEngine = e;
            e.postMessage("uci");
          }
        });
      }
    } else {
      // Direct global — engine already initialized
      postOut({ type: "error", message: "Unexpected Stockfish API format" });
    }
  } catch (err) {
    postOut({ type: "error", message: `Engine load failed: ${err}` });
  }
}

function sendToEngine(cmd: string) {
  const engine = (globalThis as any).__sfEngine;
  if (engine && typeof engine.postMessage === "function") {
    engine.postMessage(cmd);
  }
}

function search(fen: string, difficulty: SearchMessage["difficulty"]) {
  const config = DIFFICULTY_CONFIG[difficulty];

  sendToEngine(`setoption name Skill Level value ${config.skillLevel}`);
  sendToEngine(`setoption name UCI_LimitStrength value true`);
  sendToEngine(`setoption name UCI_Elo value ${config.elo}`);
  sendToEngine(`position fen ${fen}`);
  sendToEngine(`go depth ${config.depth}`);

  const timeoutId = setTimeout(() => {
    if (resolveMove) {
      resolveMove = null;
      postOut({ type: "error", message: "AI timed out" });
    }
  }, 10_000);

  resolveMove = (move: string) => {
    clearTimeout(timeoutId);
    postOut({ type: "bestmove", move });
  };
}

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init":
      initEngine();
      break;
    case "search":
      if (engineReady) {
        search(msg.fen, msg.difficulty);
      } else {
        postOut({ type: "error", message: "Engine not ready" });
      }
      break;
  }
};
