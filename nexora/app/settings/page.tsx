import Link from "next/link";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { SignOutForm } from "./signout-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { ChevronRight, ShieldCheck } from "lucide-react";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const isStaff = ["owner", "admin", "moderator"].includes(profile.role);

  return (
    <AppShell profile={profile}>
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Settings</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          Account &amp; session
        </h1>
      </div>

      <div className="grid max-w-3xl gap-5">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <dl className="divide-y divide-line px-6">
            <Row label="Display name" value={profile.display_name} />
            <Row label="Username" value={`@${profile.username}`} />
            <Row label="Role" value={<RoleBadge role={profile.role} />} />
            <Row
              label="Visibility"
              value={<span className="capitalize">{profile.privacy}</span>}
            />
          </dl>
          <div className="border-t border-line px-6 py-4">
            <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              Edit name, avatar, bio and privacy <ChevronRight size={15} />
            </Link>
          </div>
        </Card>

        {isStaff && (
          <Card>
            <CardHeader><CardTitle>Staff</CardTitle></CardHeader>
            <div className="px-6 py-5">
              <p className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold" />
                You have staff access. The moderation console shows members, roles and the
                audit trail.
              </p>
              <Link href="/admin" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                Open admin console <ChevronRight size={15} />
              </Link>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Session</CardTitle></CardHeader>
          <div className="px-6 py-5">
            <p className="text-sm leading-relaxed text-muted">
              Sign out on this device. Your profile, XP and achievements stay safely stored.
            </p>
            <div className="mt-4"><SignOutForm /></div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
