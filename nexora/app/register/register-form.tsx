"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { signUpAction, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AvatarPicker } from "@/components/avatar-picker";

const initial: FormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  const [chosen, setChosen] = useState(false);

  return (
    <form action={action} className="space-y-4" noValidate encType="multipart/form-data">
      <div>
        <Label>Pick your avatar <span className="text-accent">*</span></Label>
        <AvatarPicker current="" requireChoice onChosen={setChosen} />
      </div>

      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          required
          minLength={2}
          maxLength={48}
          placeholder="Andreas König"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
        <p className="mt-1.5 text-[11px] text-muted">Minimum 8 characters. You can change it anytime in Settings.</p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-[#4a2323] bg-[#2a1414] px-4 py-2.5 text-sm text-[#ff9d92]">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p role="status" className="rounded-xl border border-[#1f4a2f] bg-[#12241a] px-4 py-2.5 text-sm text-[#7be0a8]">
          {state.notice}
        </p>
      )}

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending || !chosen}>
        {pending ? <Loader2 size={18} className="animate-spin" /> : null}
        {pending ? "Forging account…" : chosen ? "Create account" : "Choose an avatar to continue"}
      </Button>
    </form>
  );
}
