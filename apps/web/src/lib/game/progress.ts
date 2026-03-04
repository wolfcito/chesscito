const LOCAL_COMPLETION_KEY = "chesscito:last-completion";

export type LocalCompletion = {
  piece: string;
  challenge: string;
  score: number;
  status: "success";
  target: string;
  moves: number;
  completedAt: string;
};

export function recordLocalCompletion(payload: LocalCompletion) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_COMPLETION_KEY, JSON.stringify(payload));
  window.dispatchEvent(
    new CustomEvent("chesscito:challenge-complete", {
      detail: payload,
    })
  );
}

export function getLocalCompletionKey() {
  return LOCAL_COMPLETION_KEY;
}
