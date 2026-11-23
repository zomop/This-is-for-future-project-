"use client";

import { useEffect, useRef, useState } from "react";
import { createWorldGame, type WorldInput } from "@/world/game";
import { REGION_TOASTS } from "@/world/constants";
import { cn } from "@/lib/utils";

/**
 * Slice 3a — the live Plaza world: Phaser canvas, keyboard + touch d-pad,
 * region toasts. Multiplayer sync arrives in Slice 3b (spec §13) — there are
 * no fake players, so a solo visitor sees an empty plaza, honestly.
 */
export function WorldStage({ displayName, accent }: { displayName: string; accent: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<WorldInput>({ up: false, down: false, left: false, right: false });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const game = createWorldGame({
      container,
      accent,
      displayName,
      reducedMotion: reduced,
      input: inputRef.current,
      onRegion: (id) => setToast(REGION_TOASTS[id] ?? null),
    });
    return () => {
      game.destroy(true);
    };
  }, [accent, displayName]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const hold = (key: keyof WorldInput, value: boolean) => () => {
    inputRef.current[key] = value;
  };

  const padBtn = (key: keyof WorldInput, label: string, extra: string) => (
    <button
      type="button"
      aria-label={`Move ${label}`}
      className={cn(
        "absolute flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-panel2/85 text-foreground select-none touch-none",
        "active:bg-accent/30 active:text-accent",
        extra
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        hold(key, true)();
      }}
      onPointerUp={hold(key, false)}
      onPointerLeave={hold(key, false)}
      onPointerCancel={hold(key, false)}
    >
      {label}
    </button>
  );

  return (
    <section aria-label="Pixel world" className="space-y-3">
      {/* honest slice status (spec §13: labels update as slices land) */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
        <span className="rounded-full border border-accentdim bg-accent/10 px-2.5 py-1 text-accent">
          Live: Plaza + movement
        </span>
        <span className="rounded-full border border-line bg-panel2 px-2.5 py-1 text-muted">
          Next: multiplayer sync (Slice 3b)
        </span>
        <span className="rounded-full border border-line bg-panel2 px-2.5 py-1 text-muted">
          Then: 5 more zones, chat bubbles
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-line bg-[#0d1017]">
        <div ref={containerRef} className="mx-auto aspect-[3/2] w-full max-w-[960px]" />

        {/* region toast */}
        {toast && (
          <p
            role="status"
            className="absolute left-1/2 top-3 max-w-[92%] -translate-x-1/2 rounded-full border border-line bg-panel/95 px-4 py-1.5 text-[11px] font-semibold text-foreground shadow-lg"
          >
            {toast}
          </p>
        )}

        {/* touch d-pad (mobile) */}
        <div className="pointer-events-none absolute inset-0 md:hidden">
          <div className="pointer-events-auto absolute bottom-4 left-4 h-36 w-36">
            {padBtn("up", "▲", "left-12 top-0")}
            {padBtn("left", "◀", "left-0 top-12")}
            {padBtn("right", "▶", "left-24 top-12")}
            {padBtn("down", "▼", "left-12 top-24")}
          </div>
        </div>

        {/* keyboard hint */}
        <p className="absolute bottom-2 right-3 hidden text-[10px] font-semibold uppercase tracking-wider text-muted md:block">
          Arrows / WASD to walk
        </p>
      </div>
    </section>
  );
}
