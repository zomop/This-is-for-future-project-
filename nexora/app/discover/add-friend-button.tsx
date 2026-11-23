"use client";

import { useActionState } from "react";
import { UserPlus, Loader2, Check, Users } from "lucide-react";
import { sendFriendRequestAction, type FriendFormState } from "@/lib/actions/friends";
import { Button } from "@/components/ui/button";

const initial: FriendFormState = {};

/** One-click friend request from a Discover result card. */
export function AddFriendButton({ username }: { username: string }) {
  const [state, action, pending] = useActionState(sendFriendRequestAction, initial);

  // The action's notices are server-authored strings, not user input.
  const alreadyFriends = state.notice?.includes("already friends") ?? false;
  const settled = Boolean(state.notice);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="username" value={username} />
      {settled ? (
        <span
          className="inline-flex max-w-[140px] items-center gap-1 truncate rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted"
          title={state.notice ?? undefined}
        >
          {alreadyFriends ? <Users size={13} /> : <Check size={13} />}
          {alreadyFriends ? "Friends" : "Requested"}
        </span>
      ) : (
        <Button
          type="submit"
          size="sm"
          variant="accent"
          disabled={pending}
          aria-label={`Send friend request to @${username}`}
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <UserPlus size={14} />
          )}{" "}
          Add
        </Button>
      )}
      {state.error && (
        <span className="max-w-[160px] truncate text-[10px] font-semibold text-red-400" title={state.error}>
          {state.error}
        </span>
      )}
    </form>
  );
}
