"use client";

import { useActionState, useState } from "react";
import { Loader2, Trophy, X } from "lucide-react";
import { AvatarPicker } from "@/components/avatar-picker";
import { BannerPicker } from "@/components/banner-picker";
import { updateProfileAction, type ProfileFormState } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import type { Profile } from "@/lib/types";

const initial: ProfileFormState = {};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  // Derive toast visibility from server state + a local dismiss flag (no effect needed)
  const [dismissedUnlock, setDismissedUnlock] = useState<string | null>(null);
  const unlock = state.unlockedAchievement ?? null;
  const showUnlock = unlock !== null && unlock !== dismissedUnlock;

  return (
    <form action={action} className="max-w-2xl space-y-5" noValidate>
      {/* avatar picker (bundled defaults + device upload) */}
      <AvatarPicker current={profile.avatar_url} frame={profile.frame_slug} />

      {/* banner picker (static presets + animated pixel scenes) */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
          Profile banner
        </p>
        <BannerPicker current={profile.banner_url} />
      </div>


      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="display_name">Display name</Label>
          <Input id="display_name" name="display_name" defaultValue={profile.display_name} maxLength={48} required />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">@</span>
            <Input id="username" name="username" defaultValue={profile.username} className="pl-8" maxLength={24} required />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Input id="status" name="status" defaultValue={profile.status} maxLength={80} placeholder="“Catching legends at the pier.”" />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={profile.bio} maxLength={280} placeholder="Tell the realm who you are…" />
        <p className="mt-1.5 text-[11px] tabular-nums text-muted">Max 280 characters.</p>
      </div>

      <div>
        <Label htmlFor="privacy">Who can see your profile</Label>
        <Select id="privacy" name="privacy" defaultValue={profile.privacy}>
          <option value="public">Public — anyone, even guests</option>
          <option value="friends">Members only — signed-in travelers</option>
          <option value="private">Private — only you and staff</option>
        </Select>
        <p className="mt-1.5 text-[11px] text-muted">
          Enforced in the database with row-level security — not just hidden in the UI.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-[#4a2323] bg-[#2a1414] px-4 py-2.5 text-sm text-[#ff9d92]">
          {state.error}
        </p>
      )}
      {state.notice && !state.error && (
        <p role="status" className="rounded-xl border border-[#1f4a2f] bg-[#12241a] px-4 py-2.5 text-sm text-[#7be0a8]">
          {state.notice}
        </p>
      )}

      {/* achievement unlock toast */}
      {showUnlock && state.unlockedAchievement && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-golddim/60 bg-[#241c0c] px-5 py-4"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-golddim bg-[#33270f] text-gold">
            <Trophy size={20} />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">Achievement unlocked</p>
            <p className="text-sm font-bold text-foreground">{state.unlockedAchievement} <span className="text-gold">+100 XP</span></p>
          </div>
          <button type="button" aria-label="Dismiss" onClick={() => setDismissedUnlock(unlock)} className="rounded-lg p-1.5 text-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>
      )}

      <Button type="submit" variant="gold" size="lg" disabled={pending}>
        {pending ? <Loader2 size={18} className="animate-spin" /> : null}
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
