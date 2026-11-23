"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { joinViaInviteAction, type CommunityFormState } from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";

const initial: CommunityFormState = {};

export function AcceptInvite({ code, slug }: { code: string; slug: string }) {
  const [state, action, pending] = useActionState(joinViaInviteAction, initial);

  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <input type="hidden" name="code" value={code} />
      <Button type="submit" variant="accent" size="sm" disabled={pending}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />} Accept
        invite
      </Button>
      {state.error && (
        <p aria-live="polite" className="text-[10.5px] font-semibold text-bad">
          {state.error} — <a className="underline" href={`/communities/${slug}`}>go to community</a>
        </p>
      )}
    </form>
  );
}
