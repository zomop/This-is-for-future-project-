"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createCommunityAction, type CommunityFormState } from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerVariant } from "@/lib/types";

const initial: CommunityFormState = {};

const BANNERS: { value: BannerVariant; label: string; swatch: string }[] = [
  { value: "island", label: "Island", swatch: "from-[#6fc9ea] to-[#2b86c2]" },
  { value: "sunset", label: "Sunset", swatch: "from-[#f2874f] to-[#7a2f5e]" },
  { value: "night", label: "Night", swatch: "from-[#101a3e] to-[#0b1230]" },
  { value: "arcade", label: "Arcade", swatch: "from-[#241246] to-[#0d0820]" },
];

const inputCls =
  "w-full rounded-xl border border-line bg-panel2 px-3 py-2.5 text-[12.5px] text-foreground outline-none placeholder:text-muted focus:border-accentdim";

export function CreateCommunityForm() {
  const [state, action, pending] = useActionState(createCommunityAction, initial);
  const [banner, setBanner] = useState<BannerVariant>("island");

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Name</span>
          <input name="name" maxLength={48} placeholder="Pixel Artists" className={inputCls} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Address
          </span>
          <input
            name="slug"
            maxLength={32}
            placeholder="pixel-artists"
            className={cn(inputCls, "font-mono")}
            required
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
          Description
        </span>
        <textarea
          name="description"
          rows={2}
          maxLength={280}
          placeholder="What is this community about?"
          className={inputCls}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Icon / emoji
          </span>
          <input name="emoji" maxLength={8} placeholder="🎨" className={inputCls} defaultValue="🏝️" />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Pixel banner
          </span>
          <input type="hidden" name="banner_variant" value={banner} />
          <div className="flex gap-1.5">
            {BANNERS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => setBanner(b.value)}
                aria-pressed={banner === b.value}
                title={b.label}
                className={cn(
                  "h-9 flex-1 rounded-lg bg-gradient-to-b border transition-all",
                  b.swatch,
                  banner === b.value
                    ? "border-accent ring-1 ring-accent"
                    : "border-line opacity-70 hover:opacity-100"
                )}
              >
                <span className="sr-only">{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2.5 rounded-xl border border-line bg-panel2 px-3 py-2.5">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked
          className="h-4 w-4 accent-[#41d4f4]"
        />
        <span className="text-[11.5px] text-foreground">
          Public — anyone can find and join it. Uncheck for invite-only.
        </span>
      </label>

      {state.error && (
        <p aria-live="polite" className="text-[11px] font-semibold text-bad">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="accent" size="sm" disabled={pending} className="self-start">
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
        community
      </Button>
    </form>
  );
}
