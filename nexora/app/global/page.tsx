import Link from "next/link";
import { Globe, Radio, ShieldCheck, Crown } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { GlobalChat } from "@/components/global-chat";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { FramedAvatar } from "@/components/framed-avatar";
import { getGlobalMessages, getStaffMembers } from "@/lib/data";

export const metadata = { title: "Global chat" };
export const dynamic = "force-dynamic";

export default async function GlobalChatPage() {
  const profile = await requireProfile();
  const [messages, staff] = await Promise.all([
    getGlobalMessages(120),
    getStaffMembers(8),
  ]);

  return (
    <AppShell profile={profile}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
            <Globe size={11} className="mr-1 inline -translate-y-[1px]" />
            Global
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            One island, one voice.
          </h1>
        </div>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
          <Radio size={13} className="text-good" /> Live over Realtime
        </p>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_264px]">
        <GlobalChat meId={profile.id} myRole={profile.role} initialMessages={messages} />

        {/* side rail: staff + house rules (decorative rail, real roster) */}
        <aside className="hidden space-y-5 xl:block">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown size={13} /> The crew
              </CardTitle>
            </CardHeader>
            <ul className="space-y-1 p-3">
              {staff.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/u/${s.username}`}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]"
                  >
                    <FramedAvatar
                      src={s.avatar_url}
                      alt=""
                      size={34}
                      frame={s.frame_slug}
                      className="border border-line"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold text-foreground">
                        {s.display_name}
                      </span>
                      <RoleBadge role={s.role} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={13} /> House rules
              </CardTitle>
            </CardHeader>
            <ol className="list-none space-y-2 p-4 text-[11px] leading-snug text-muted">
              <li><span className="font-bold text-foreground">1.</span> Be kind — new travelers are welcome here.</li>
              <li><span className="font-bold text-foreground">2.</span> No spam, self-promo or scams in the island square.</li>
              <li><span className="font-bold text-foreground">3.</span> Keep catches and stories honest — no fudged screenshots.</li>
              <li><span className="font-bold text-foreground">4.</span> Staff (
                <span className="font-semibold text-foreground">mod+</span>) can remove messages. Appeal to the owner, not the void.
              </li>
            </ol>
          </Card>
        </aside>
      </div>

      <p className="mt-4 text-[11px] text-muted">
        Newest 120 messages load on open; everything is stored and synced live.
        Staff can delete any message — your own messages can be deleted anytime.
      </p>
    </AppShell>
  );
}
