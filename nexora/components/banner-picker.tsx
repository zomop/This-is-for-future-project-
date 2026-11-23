"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Check, Loader2 } from "lucide-react";
import { PixelBanner } from "@/components/pixel-banner";
import { updateBannerAction, type DesignFormState } from "@/lib/actions/design";
import { cn } from "@/lib/utils";

/**
 * Profile banner picker — tap a tile and it saves immediately (same UX as the
 * frame picker; no Save button to forget). Options are static preset images
 * (`/banners/…`) or animated pixel scenes (`pix:<variant>`) rendered live in
 * the tile. Everything is validated server-side against PROFILE_BANNERS.
 */

const initial: DesignFormState = {};

const OPTIONS: { value: string; name: string; note: string }[] = [
  { value: "/banners/field.png", name: "Fallen Sword", note: "Classic · static art" },
  { value: "pix:island", name: "Driftwood Isle", note: "Animated · palms & sea" },
  { value: "pix:sunset", name: "Sunset Harbor", note: "Animated · warm water" },
  { value: "pix:night", name: "Night Crossing", note: "Animated · moon & fireflies" },
  { value: "pix:arcade", name: "Neon Arcade", note: "Animated · grid & coins" },
  { value: "pix:forest", name: "Whispering Forest", note: "Animated · leaves & pond" },
  { value: "pix:rain", name: "Rainy Night", note: "Animated · rain & lightning" },
];

export function BannerPicker({ current }: { current: string }) {
  const [state, action, pending] = useActionState(updateBannerAction, initial);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const equipped = current === opt.value;
          const pix = opt.value.startsWith("pix:")
            ? opt.value.slice(4)
            : null;
          return (
            <form key={opt.value} action={action} className="contents">
              <button
                type="submit"
                name="banner_url"
                value={opt.value}
                disabled={pending}
                aria-pressed={equipped}
                title={opt.name}
                className={cn(
                  "group relative flex flex-col gap-1.5 rounded-2xl border p-1.5 text-left transition-all",
                  equipped
                    ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                    : "border-line bg-panel2 hover:border-panel3 hover:bg-panel3/40"
                )}
              >
                {pix ? (
                  <PixelBanner variant={pix as never} className="h-14 w-full rounded-xl border-0" />
                ) : (
                  <Image
                    src={opt.value}
                    alt=""
                    width={280}
                    height={112}
                    className="h-14 w-full rounded-xl object-cover object-[72%_28%]"
                  />
                )}
                <div className="flex items-start justify-between gap-1 px-1.5 pb-1">
                  <div>
                    <p className="text-[11px] font-bold text-foreground">{opt.name}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted">{opt.note}</p>
                  </div>
                  {equipped && (
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-black">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </div>
                {pending && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 p-1">
                    <Loader2 size={11} className="animate-spin text-accent" />
                  </span>
                )}
              </button>
            </form>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted" role="status" aria-live="polite">
        {state.error ?? state.notice ?? "Tap a banner to equip it — it saves instantly."}
      </p>
    </div>
  );
}
