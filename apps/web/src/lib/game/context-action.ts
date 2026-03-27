export type ContextAction =
  | "submitScore"
  | "useShield"
  | "claimBadge"
  | "retry"
  | null;

export type ContextActionState = {
  phase: "ready" | "success" | "failure";
  shieldsAvailable: number;
  scorePending: boolean;
  badgeClaimable: boolean;
  isConnected: boolean;
  isCorrectChain: boolean;
};

export function getContextAction(state: ContextActionState): ContextAction {
  if (!state.isConnected || !state.isCorrectChain) return null;

  if (state.phase === "failure") return "retry";

  if (state.scorePending) return "submitScore";
  if (state.badgeClaimable) return "claimBadge";

  return null;
}
