"use client";

import dynamic from "next/dynamic";

/** Client-only boundary: Phaser must never run during SSR. */
const WorldStage = dynamic(
  () => import("@/components/world-stage").then((m) => m.WorldStage),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[3/2] w-full max-w-[960px] animate-pulse rounded-2xl border border-line bg-panel2/60" />
    ),
  }
);

export function WorldClient({ displayName, accent }: { displayName: string; accent: string }) {
  return <WorldStage displayName={displayName} accent={accent} />;
}
