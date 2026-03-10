import type { ReactNode } from "react";
import { CTA_LABELS } from "@/lib/content/editorial";

type OnChainActionsPanelProps = {
  effectiveLevelId: string;
  canSubmit: boolean;
  isSubmitBusy: boolean;
  isGlobalBusy: boolean;
  qaEnabled: boolean;
  qaLevelInput: string;
  isQaLevelValid: boolean;
  onQaLevelInputChange: (next: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  badgeControl: ReactNode;
  shopControl: ReactNode;
  leaderboardControl: ReactNode;
  shieldCount?: number;
};

function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
  busy,
  variant = "default",
  showNotification,
  badge,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: "default" | "primary";
  showNotification?: boolean;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={busy ? `${label} in progress` : label}
      className={`relative flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl transition disabled:opacity-35 ${
        variant === "primary"
          ? "bg-cyan-400/15 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.25)]"
          : "text-cyan-100/70"
      }`}
    >
      {busy ? (
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100/85">...</span>
      ) : (
        <picture className="h-full w-full">
          <source srcSet={icon.replace(/\.png$/, ".avif")} type="image/avif" />
          <source srcSet={icon.replace(/\.png$/, ".webp")} type="image/webp" />
          <img src={icon} alt="" aria-hidden="true" className="h-full w-full object-contain p-0.5" />
        </picture>
      )}
      {showNotification && !disabled && !busy ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
        </span>
      ) : null}
      {badge && badge > 0 ? (
        <span className="absolute -left-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[0.5rem] font-bold text-white shadow">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function OnChainActionsPanel({
  effectiveLevelId,
  canSubmit,
  isSubmitBusy,
  isGlobalBusy,
  qaEnabled,
  qaLevelInput,
  isQaLevelValid,
  onQaLevelInputChange,
  onSubmit,
  onReset,
  badgeControl,
  shopControl,
  leaderboardControl,
  shieldCount,
}: OnChainActionsPanelProps) {
  return (
    <div className="space-y-2">
      {qaEnabled ? (
        <details className="mission-soft rune-frame rounded-xl px-3 py-2 text-xs text-slate-200">
          <summary className="cursor-pointer list-none font-semibold uppercase tracking-[0.2em] text-cyan-300">
            QA mode
          </summary>
          <div className="mt-2 space-y-2">
            <label className="block">
              Level ID override
              <input
                type="number"
                min={1}
                max={9999}
                step={1}
                value={qaLevelInput}
                onChange={(event) => onQaLevelInputChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-cyan-600/45 bg-slate-900/90 px-3 py-2 text-sm text-cyan-50"
              />
            </label>
            {!isQaLevelValid ? (
              <p className="text-rose-300">Use a whole number between 1 and 9999.</p>
            ) : (
              <p className="text-emerald-300">{CTA_LABELS.claimBadge} and {CTA_LABELS.submitScore} will use levelId {effectiveLevelId}.</p>
            )}
          </div>
        </details>
      ) : null}

      {/* Icon action bar */}
      <div className="flex items-center justify-around">
        <ActionBtn icon="/art/refresh-chesscito.png" label={CTA_LABELS.resetTrial} onClick={onReset} disabled={isGlobalBusy} badge={shieldCount} />
        {badgeControl}
        <ActionBtn
          icon="/art/score-chesscito.png"
          label={CTA_LABELS.submitScore}
          onClick={onSubmit}
          disabled={!canSubmit}
          busy={isSubmitBusy}
          variant="primary"
          showNotification={canSubmit}
        />
        {shopControl}
        {leaderboardControl}
      </div>
    </div>
  );
}
