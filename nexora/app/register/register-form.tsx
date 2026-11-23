"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signUpAction, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initial: FormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
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

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 size={18} className="animate-spin" /> : null}
        {pending ? "Forging account…" : "Create account"}
      </Button>
    </form>
  );
}
