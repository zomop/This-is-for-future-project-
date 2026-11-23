import * as React from "react";
import { Crown, ShieldCheck, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";

/**
 * Role badges. Staff ranks (moderator and above) carry a shimmer sweep and a
 * soft glow — think Discord's staff treatments. Colors stay high-contrast on
 * the dark theme.
 */

const ROLE_STYLE: Record<AppRole, string> = {
  guest: "border-line bg-panel2 text-muted",
  member: "border-[#1f4a5e] bg-[#102a38] text-[#6fd6f6]",
  contributor: "border-[#2b4a2f] bg-[#14291a] text-[#7be0a8]",
  moderator: "border-[#6b5320] bg-[#2a2210] text-[#eccb6f] shadow-[0_0_10px_rgba(236,203,111,0.22)]",
  admin: "border-[#5e2b4a] bg-[#2a141f] text-[#f08bc0] shadow-[0_0_10px_rgba(240,139,192,0.25)]",
  owner: "border-golddim bg-[#2a2110] text-gold shadow-[0_0_12px_rgba(232,193,90,0.35)]",
};

const ROLE_ICON: Partial<Record<AppRole, React.ComponentType<{ size?: number; strokeWidth?: number }>>> = {
  contributor: Sparkles,
  moderator: Shield,
  admin: ShieldCheck,
  owner: Crown,
};

const STAFF: AppRole[] = ["moderator", "admin", "owner"];

export function RoleBadge({ role }: { role: AppRole }) {
  const Icon = ROLE_ICON[role];
  const staff = STAFF.includes(role);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
        ROLE_STYLE[role],
        staff && "badge-shine"
      )}
      title={staff ? `${ROLE_LABEL[role]} — NEXORA staff` : ROLE_LABEL[role]}
    >
      {Icon && <Icon size={11} strokeWidth={2.2} aria-hidden />}
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
