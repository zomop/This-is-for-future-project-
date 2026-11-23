import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Sparkles, MessagesSquare, Sword, Fish, Users } from "lucide-react";
import { getUser } from "@/lib/data";
import { Logo } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "NEXORA — Social World" };

export default async function LandingPage() {
  const user = await getUser();
  if (user) redirect("/home");

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* backdrop artwork */}
      <Image
        src="/banners/field.png"
        alt="Colossal broken sword in a moonlit field — NEXORA key art"
        fill
        priority
        className="pixelated object-cover object-[62%_center] opacity-90"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/78 to-graphite/5"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-graphite/60"
        aria-hidden
      />

      {/* top bar */}
      <header className="relative z-10 flex h-16 items-center justify-between px-5 sm:px-10">
        <Logo />
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Sign in
        </Link>
      </header>

      {/* hero copy */}
      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-5 pb-16 sm:px-10">
        <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
          <Sparkles size={12} /> Alpha · Season 0
        </p>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          Your squad.
          <br />
          Your world.
          <br />
          <span className="text-accent">One NEXORA.</span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-[#c6d0e0]">
          A social platform stitched into a shared pixel world — real-time chat,
          friends, communities, and legendary fishing. Register, gear up, and
          meet the realm.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/register" className={cn(buttonVariants({ variant: "gold", size: "lg" }))}>
            Create your account
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            I already play
          </Link>
        </div>

        {/* feature strip */}
        <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          <li className="inline-flex items-center gap-2"><MessagesSquare size={14} className="text-accent" /> Real-time chat</li>
          <li className="inline-flex items-center gap-2"><Sword size={14} className="text-accent" /> Shared world</li>
          <li className="inline-flex items-center gap-2"><Fish size={14} className="text-accent" /> Legendary fishing</li>
          <li className="inline-flex items-center gap-2"><Users size={14} className="text-accent" /> Communities</li>
        </ul>
      </div>
    </main>
  );
}
