/// <reference lib="webworker" />

// This file runs as a Web Worker (module type).
// It loads Stockfish WASM via dynamic import and communicates via postMessage.

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

let engine: { uci: (cmd: string) => void } | null = null;
let resolveMove: ((move: string) => void) | null = null;

function postOut(msg: OutMessage) {
  self.postMessage(msg);
}

function handleLine(line: string) {
  if (line.startsWith("bestmove")) {
    const move = line.split(" ")[1];
    if (move && resolveMove) {
      const cb = resolveMove;
      resolveMove = null;
      cb(move);
    }
  }
}

async function initEngine() {
  try {
    // Dynamic import of the Stockfish ES module from public/engines/
    // @ts-expect-error — runtime URL, not a TS module
    const { default: StockfishFactory } = await import("/engines/sf171-79.js");

    const sf = await StockfishFactory({
      listen: (line: string) => handleLine(line),
      onError: (err: string) => console.error("Stockfish error:", err),
    });

    engine = sf;
    postOut({ type: "ready" });
  } catch (err) {
    postOut({ type: "error", message: `Engine load failed: ${err}` });
  }
}

function search(fen: string, difficulty: SearchMessage["difficulty"]) {
  if (!engine) {
    postOut({ type: "error", message: "Engine not initialized" });
    return;
  }

  const config = DIFFICULTY_CONFIG[difficulty];

  engine.uci(`setoption name Skill Level value ${config.skillLevel}`);
  engine.uci(`setoption name UCI_LimitStrength value true`);
  engine.uci(`setoption name UCI_Elo value ${config.elo}`);
  engine.uci(`position fen ${fen}`);
  engine.uci(`go depth ${config.depth}`);

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
      if (engine) {
        search(msg.fen, msg.difficulty);
      } else {
        postOut({ type: "error", message: "Engine not ready" });
      }
      break;
  }
};
