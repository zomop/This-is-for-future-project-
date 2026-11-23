"use client";

import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { sendFriendRequestAction, type FriendFormState } from "@/lib/actions/friends";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: FriendFormState = {};

export function AddFriendForm() {
  const [state, action, pending] = useActionState(sendFriendRequestAction, initial);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative flex-1">
        <span aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">@</span>
        <Input name="username" placeholder="username" aria-label="Friend's username" className="pl-8" maxLength={24} required />
      </div>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        {pending ? "Sending…" : "Send request"}
      </Button>
      {state.error && <p role="alert" className="text-sm text-[#ff9d92] sm:w-full">{state.error}</p>}
      {state.notice && <p role="status" className="text-sm text-[#7be0a8] sm:w-full">{state.notice}</p>}
    </form>
  );
}
