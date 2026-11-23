"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquare, UserMinus, X, Loader2 } from "lucide-react";
import {
  acceptFriendRequestAction,
  declineFriendRequestAction,
  removeFriendshipAction,
  removeFriendshipByPairAction,
  openDirectConversationAction,
} from "@/lib/actions/friends";
import { Button } from "@/components/ui/button";

/**
 * Row actions for friend requests and friends.
 * mode: "incoming" (accept/decline), "outgoing" (cancel), "none" (message/remove friend)
 */
export function FriendActions({
  friendshipId,
  mode,
  friendId,
}: {
  friendshipId: string;
  mode: "incoming" | "outgoing" | "none";
  friendId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (mode === "incoming") {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="accent"
          disabled={pending}
          aria-label="Accept request"
          onClick={() => startTransition(() => acceptFriendRequestAction(friendshipId))}
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />} Accept
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          aria-label="Decline request"
          onClick={() => startTransition(() => declineFriendRequestAction(friendshipId))}
        >
          <X size={15} /> Decline
        </Button>
      </div>
    );
  }

  if (mode === "outgoing") {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0"
        disabled={pending}
        aria-label="Cancel request"
        onClick={() => startTransition(() => removeFriendshipAction(friendshipId))}
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <X size={15} />} Cancel
      </Button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        size="sm"
        variant="accent"
        disabled={pending || !friendId}
        aria-label="Send message"
        onClick={() =>
          startTransition(async () => {
            if (!friendId) return;
            const res = await openDirectConversationAction(friendId);
            if (res.id) router.push(`/messages/${res.id}`);
          })
        }
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={15} />}
        Message
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending || !friendId}
        aria-label="Remove friend"
        title="Remove friend"
        onClick={() => {
          if (!friendId) return;
          startTransition(() => removeFriendshipByPairAction(friendId));
        }}
      >
        <UserMinus size={15} />
      </Button>
    </div>
  );
}
