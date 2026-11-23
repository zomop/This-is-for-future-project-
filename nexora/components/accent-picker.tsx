"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateAccentAction, type DesignFormState } from "@/lib/actions/design";
import { ACCENT_THEMES } from "@/lib/design";
import { cn } from "@/lib/utils";

/**
 * Accent-color picker for the site chrome. Tap a tile and it saves instantly,
 * re-coloring every accent element (buttons, links, focus rings) for that user
 * via CSS variables — stored in `profiles.accent_theme`, validated server-side.
 */

const initial: DesignFormState = {};

export function AccentPicker({ current }: { current: string }) {
  const [state, action, pending] = useActionState(updateAccentAction, initial);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ACCENT_THEMES.map((theme) => {
          const equipped = current === theme.slug;
          return (
            <form key={theme.slug} action={action} className="contents">
              <button
                type="submit"
                name="accent_theme"
                value={theme.slug}
                disabled={pending}
                aria-pressed={equipped}
                title={theme.name}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all",
                  equipped
                    ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                    : "border-line bg-panel2 hover:border-panel3 hover:bg-panel3/40"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-full bg-gradient-to-br ring-1 ring-white/15",
                    theme.swatch
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold text-foreground">
                    {theme.name}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-muted">
                    {theme.slug}
                  </span>
                </span>
                {equipped && (
                  <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-black">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
                {pending && (
                  <span className="absolute right-2 top-2">
                    <Loader2 size={11} className="animate-spin text-accent" />
                  </span>
                )}
              </button>
            </form>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted" role="status" aria-live="polite">
        {state.error ?? state.notice ?? "Tap a color — it applies to the whole site instantly."}
      </p>
    </div>
  );
}
