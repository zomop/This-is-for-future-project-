"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { changePasswordAction, resetRequestAction, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const initial: FormState = {};

/**
 * Dual-mode form:
 *  - without a recovery session: request a reset email
 *  - with a recovery session (Supabase redirects back with tokens): set a new password
 */
export function ResetForm() {
  const router = useRouter();
  const [hasRecovery, setHasRecovery] = useState<boolean | null>(null);
  const [requestState, requestAction, requestPending] = useActionState(resetRequestAction, initial);
  const [changeState, changeAction, changePending] = useActionState(changePasswordAction, initial);

  useEffect(() => {
    const supabase = createClient();
    // If we arrived via the recovery link, a session is already established.
    supabase.auth.getSession().then(({ data }) => setHasRecovery(Boolean(data.session)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (hasRecovery === null) {
    return <div className="h-40 animate-pulse rounded-xl bg-panel2" />;
  }

  if (hasRecovery) {
    return (
      <form action={changeAction} className="space-y-4" noValidate>
        <p role="status" className="rounded-xl border border-accentdim/50 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          Recovery link verified. Choose a new password.
        </p>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>
        {changeState.error && (
          <p role="alert" className="rounded-xl border border-[#4a2323] bg-[#2a1414] px-4 py-2.5 text-sm text-[#ff9d92]">
            {changeState.error}
          </p>
        )}
        {changeState.notice && (
          <p role="status" className="rounded-xl border border-[#1f4a2f] bg-[#12241a] px-4 py-2.5 text-sm text-[#7be0a8]">
            {changeState.notice}{" "}
            <button type="button" className="font-semibold underline" onClick={() => router.push("/home")}>
              Continue to NEXORA →
            </button>
          </p>
        )}
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={changePending}>
          {changePending ? <Loader2 size={18} className="animate-spin" /> : null}
          {changePending ? "Updating…" : "Update password"}
        </Button>
      </form>
    );
  }

  return (
    <form action={requestAction} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="email">Account email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      {requestState.error && (
        <p role="alert" className="rounded-xl border border-[#4a2323] bg-[#2a1414] px-4 py-2.5 text-sm text-[#ff9d92]">
          {requestState.error}
        </p>
      )}
      {requestState.notice && (
        <p role="status" className="rounded-xl border border-[#1f4a2f] bg-[#12241a] px-4 py-2.5 text-sm text-[#7be0a8]">
          {requestState.notice}
        </p>
      )}
      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={requestPending}>
        {requestPending ? <Loader2 size={18} className="animate-spin" /> : null}
        {requestPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
