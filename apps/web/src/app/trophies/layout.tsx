import type { Metadata } from "next";
import { TROPHY_VITRINE_COPY } from "@/lib/content/editorial";

export const metadata: Metadata = {
  title: `${TROPHY_VITRINE_COPY.pageTitle} — Chesscito`,
  description: TROPHY_VITRINE_COPY.pageDescription,
};

export default function TrophiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
