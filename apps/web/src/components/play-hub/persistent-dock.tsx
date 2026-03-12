import type { ReactNode } from "react";

type PersistentDockProps = {
  badgeControl: ReactNode;
  shopControl: ReactNode;
  leaderboardControl: ReactNode;
};

export function PersistentDock({
  badgeControl,
  shopControl,
  leaderboardControl,
}: PersistentDockProps) {
  return (
    <div className="flex items-center justify-around px-8 pb-[calc(4px+env(safe-area-inset-bottom))] pt-2">
      {badgeControl}
      {shopControl}
      {leaderboardControl}
    </div>
  );
}
