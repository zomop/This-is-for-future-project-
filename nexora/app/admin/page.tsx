import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Users, ScrollText } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await requireProfile();
  if (!["owner", "admin", "moderator"].includes(profile.role)) redirect("/home");

  const supabase = await createClient();

  // Member overview (RLS: staff can read all profiles)
  const { data: members } = await supabase
    .from("profiles")
    .select("id, username, display_name, role, xp, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  // Audit trail (RLS: owner/admin only)
  const { data: audit, error: auditError } = await supabase
    .from("audit_log")
    .select("id, actor_role, action, target_type, target_id, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  const counts = (members ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell profile={profile}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold">Staff console</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">Moderation &amp; roles</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-golddim/60 bg-[#241c0c] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
          <ShieldAlert size={12} /> Phase 1 preview
        </span>
      </div>

      {/* role census */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["owner", "admin", "moderator", "contributor", "member"] as AppRole[]).map((r) => (
          <div key={r} className="rounded-2xl border border-line bg-panel px-4 py-4 text-center">
            <p className="text-2xl font-extrabold tabular-nums text-foreground">{counts[r] ?? 0}</p>
            <div className="mt-1.5 flex justify-center"><RoleBadge role={r} /></div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        {/* members table */}
        <Card className="overflow-hidden lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Users size={13} /> Members</CardTitle>
            <span className="text-[11px] text-muted">latest {members?.length ?? 0}</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.18em] text-muted">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 text-right font-semibold">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(members ?? []).map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <Link href={`/u/${m.username}`} className="font-semibold text-foreground hover:text-accent">
                        {m.display_name}
                      </Link>
                      <span className="block text-[11px] text-muted">@{m.username}</span>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={m.role as AppRole} /></td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-foreground">
                      {m.xp.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* audit log */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><ScrollText size={13} /> Audit log</CardTitle>
            <span className="text-[11px] text-muted">latest {audit?.length ?? 0}</span>
          </CardHeader>
          {auditError ? (
            <p className="px-6 py-6 text-xs text-muted">
              Audit entries are visible to Owner/Admin only.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {(audit ?? []).map((entry) => (
                <li key={entry.id} className="px-5 py-3 text-[12px] leading-snug">
                  <p className="font-semibold text-foreground">
                    {entry.action}
                    <span className="ml-2 rounded border border-line bg-panel2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">
                      {entry.actor_role}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {entry.target_type} · {new Date(entry.created_at).toLocaleString("en-GB")}
                  </p>
                </li>
              ))}
              {(audit ?? []).length === 0 && (
                <li className="px-5 py-8 text-center text-xs text-muted">
                  No audited events yet. Role grants and moderation actions will appear here.
                </li>
              )}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-muted">
        Phase 5 will add: role grants and bans with typed confirmation, report queues, AI output
        review, cache purge and deployment status. This read-only view ships in Phase 1.
      </p>
    </AppShell>
  );
}
