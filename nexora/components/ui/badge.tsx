import * as React from "react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";

const ROLE_STYLE: Record<AppRole, string> = {
  guest: "border-line bg-panel2 text-muted",
  member: "border-[#1f4a5e] bg-[#102a38] text-[#6fd6f6]",
  contributor: "border-[#2b4a2f] bg-[#14291a] text-[#7be0a8]",
  moderator: "border-[#4a3a1f] bg-[#2a2210] text-[#eccb6f]",
  admin: "border-[#4a2b3f] bg-[#2a141f] text-[#f08bc0]",
  owner: "border-golddim bg-[#2a2110] text-gold",
};

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
        ROLE_STYLE[role]
      )}
    >
      {role === "owner" && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
          <path d="M1 3.2 2.6 6 5 2.1 7.4 6 9 3.2 9.6 7.6H.4L1 3.2Z" />
        </svg>
      )}
      {ROLE_LABEL[role]}
    </span>
  );
}

export function Chip({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-line bg-panel2 px-2 py-0.5 text-[11px] font-medium text-muted",
        className
      )}
      {...props}
    />
  );
}
