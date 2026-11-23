"use client";

import { useState } from "react";
import Image from "next/image";
import { PixelBanner } from "@/components/pixel-banner";
import { cn } from "@/lib/utils";
import type { BannerVariant } from "@/lib/types";

/**
 * Profile banner picker. Options are either static preset images
 * (`/banners/…`) or animated pixel scenes (`pix:<variant>`) rendered live in
 * the tile by <PixelBanner />. The selection submits as `banner_url` with the
 * profile form and is validated server-side against PROFILE_BANNERS.
 */

const OPTIONS: { value: string; name: string; note: string }[] = [
  { value: "/banners/field.png", name: "Fallen Sword", note: "Classic · static art" },
  { value: "pix:island", name: "Driftwood Isle", note: "Animated · palms & sea" },
  { value: "pix:sunset", name: "Sunset Harbor", note: "Animated · warm water" },
  { value: "pix:night", name: "Night Crossing", note: "Animated · moon & fireflies" },
  { value: "pix:arcade", name: "Neon Arcade", note: "Animated · grid & coins" },
];

export function BannerPicker({ current }: { current: string }) {
  const [selected, setSelected] = useState<string>(
    OPTIONS.some((o) => o.value === current) ? current : OPTIONS[0].value
  );

  return (
    <div>
      <input type="hidden" name="banner_url" value={selected} />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const equipped = selected === opt.value;
          const pix = opt.value.startsWith("pix:")
            ? (opt.value.slice(4) as BannerVariant)
            : null;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
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
                <PixelBanner variant={pix} className="h-14 w-full rounded-xl border-0" />
              ) : (
                <Image
                  src={opt.value}
                  alt=""
                  width={280}
                  height={112}
                  className="h-14 w-full rounded-xl object-cover object-[72%_28%]"
                />
              )}
              <div className="px-1.5 pb-1">
                <p className="text-[11px] font-bold text-foreground">{opt.name}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted">{opt.note}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Animated banners are code-drawn pixel scenes — they loop on your profile,
        home card, and public page. Saved with the form.
      </p>
    </div>
  );
}
