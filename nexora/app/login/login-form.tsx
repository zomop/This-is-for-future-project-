"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signInAction, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initial: FormState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
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
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
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

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 size={18} className="animate-spin" /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
