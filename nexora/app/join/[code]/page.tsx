import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { PixelBanner } from "@/components/pixel-banner";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { inviteCodeSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { BannerVariant } from "@/lib/types";
import { AcceptInvite } from "./accept-invite";

export const metadata = { title: "Join a community" };
export const dynamic = "force-dynamic";

interface InvitePeek {
  name: string;
  emoji: string;
  banner_variant: BannerVariant;
  slug: string;
  already_member: boolean;
}

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const parsed = inviteCodeSchema.safeParse({ code: rawCode });
  if (!parsed.success) notFound();
  const code = parsed.data.code;

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("peek_community_invite", { p_code: code });
  const peek = (Array.isArray(data) ? data[0] : data) as InvitePeek | undefined;
  if (error || !peek) notFound();

  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/communities"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:underline"
        >
          <ChevronLeft size={12} /> All communities
        </Link>

        <div className="relative mt-2">
          <PixelBanner variant={peek.banner_variant} className="h-28" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 rounded-b-2xl bg-gradient-to-t from-graphite via-graphite/70 to-transparent px-5 pb-3.5 pt-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel2 text-lg">
              {peek.emoji}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
                You&apos;re invited
              </p>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">{peek.name}</h1>
            </div>
          </div>
        </div>

        <Card className="mt-4">
          <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
            <Sparkles size={18} className="text-gold" />
            <p className="max-w-sm text-[12px] text-muted">
              {peek.already_member
                ? "You are already a member of this community."
                : "A traveler invited you to join their community. Accept to see its chat, members and events."}
            </p>
            {peek.already_member ? (
              <Link
                href={`/communities/${peek.slug}`}
                className={cn(buttonVariants({ variant: "accent", size: "sm" }))}
              >
                Open {peek.name}
              </Link>
            ) : (
              <AcceptInvite code={code} slug={peek.slug} />
            )}
            <p className="text-[9.5px] text-muted">
              Invite code <span className="font-mono text-foreground/80">{code}</span>
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
