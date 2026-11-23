"use client";

import { useActionState } from "react";
import { Check, Lock, Loader2, Frame } from "lucide-react";
import { updateFrameAction, type FrameFormState } from "@/lib/actions/profile";
import { FramedAvatar } from "@/components/framed-avatar";
import { FRAMES } from "@/lib/frames";
import { levelProgress } from "@/lib/level";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const initial: FrameFormState = {};

/**
 * Frame (avatar decoration) picker. Unlocks are gated by level both here
 * (locked tiles can't be submitted) and server-side in updateFrameAction —
 * the client gate is UX, the server gate is truth.
 */
export function FramePicker({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateFrameAction, initial);
  const level = levelProgress(profile.xp).level;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {FRAMES.map((frame) => {
          const locked = level < frame.minLevel;
          const equipped = profile.frame_slug === frame.slug;
          return (
            <form key={frame.slug} action={action} className="contents">
              <button
                type="submit"
                name="frame_slug"
                value={frame.slug}
                disabled={locked || pending}
                aria-pressed={equipped}
                title={locked ? `${frame.name} — unlocks at level ${frame.minLevel}` : frame.description}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-4 text-center transition-all",
                  equipped
                    ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                    : locked
                      ? "cursor-not-allowed border-line bg-panel2/50 opacity-60"
                      : "border-line bg-panel2 hover:border-panel3 hover:bg-panel3/40"
                )}
              >
                <FramedAvatar
                  src={profile.avatar_url}
                  alt={`${frame.name} preview`}
                  size={52}
                  frame={frame.slug}
                  className={cn(locked && "saturate-0")}
                />
                <span className="text-[10px] font-bold leading-tight text-foreground">
                  {frame.name}
                </span>
                <span className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {frame.minLevel <= 1 ? "Starter" : `Level ${frame.minLevel}`}
                </span>
                {locked && (
                  <span className="absolute right-1.5 top-1.5 rounded-full border border-line bg-panel p-1 text-muted">
                    <Lock size={11} strokeWidth={2.2} aria-hidden />
                  </span>
                )}
                {equipped && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-accent p-1 text-[#062630]">
                    <Check size={11} strokeWidth={3.5} aria-hidden />
                  </span>
                )}
              </button>
            </form>
          );
        })}
      </div>

      <div className="mt-3 flex min-h-[1.5rem] items-center gap-2 text-[11px]">
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Loader2 size={12} className="animate-spin" /> Equipping…
          </span>
        )}
        {!pending && state.error && <span role="alert" className="text-[#ff9d92]">{state.error}</span>}
        {!pending && state.notice && <span role="status" className="text-[#7be0a8]">{state.notice}</span>}
        {!pending && !state.error && !state.notice && (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Frame size={12} /> Frames unlock as you level up — decorations, not pay-to-win.
          </span>
        )}
      </div>
    </div>
  );
}
