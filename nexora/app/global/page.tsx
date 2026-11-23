import { Globe, ShieldCheck, Radio } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { GlobalChat } from "@/components/global-chat";
import { getGlobalMessages } from "@/lib/data";

export const metadata = { title: "Global chat" };
export const dynamic = "force-dynamic";

export default async function GlobalChatPage() {
  const profile = await requireProfile();
  const messages = await getGlobalMessages(120);

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

      <GlobalChat meId={profile.id} myRole={profile.role} initialMessages={messages} />

      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
        <ShieldCheck size={13} className="text-accent" />
        House rules: be kind, no spam. Staff (
        <span className="font-semibold text-foreground">moderators and above</span>) can
        remove messages. Newest 120 messages load on open; everything is stored.
      </p>
    </AppShell>
  );
}
