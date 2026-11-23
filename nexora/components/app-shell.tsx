"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  MessageSquare,
  Users,
  UsersRound,
  Compass,
  Map,
  Gamepad2,
  Backpack,
  CircleUserRound,
  Settings,
  Shield,
  Menu,
  X,
  Coins,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { levelProgress } from "@/lib/level";
import { signOutAction } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/home", label: "Home", icon: Home, phase: 0 },
  { href: "/messages", label: "Messages", icon: MessageSquare, phase: 2 },
  { href: "/friends", label: "Friends", icon: Users, phase: 2 },
  { href: "/communities", label: "Communities", icon: UsersRound, phase: 2 },
  { href: "/discover", label: "Discover", icon: Compass, phase: 2 },
  { href: "/world", label: "World", icon: Map, phase: 3 },
  { href: "/games", label: "Games", icon: Gamepad2, phase: 4 },
  { href: "/inventory", label: "Inventory", icon: Backpack, phase: 4 },
  { href: "/profile", label: "Profile", icon: CircleUserRound, phase: 0 },
  { href: "/settings", label: "Settings", icon: Settings, phase: 0 },
] as const;

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/home" className="flex items-center gap-2.5" aria-label="NEXORA home">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
        <path
          d="M17 1.5 31 9.6v15.2L17 32.9 3 24.8V9.6L17 1.5Z"
          stroke="#41d4f4"
          strokeWidth="2.2"
          strokeLinejoin="round"
          fill="#131a26"
        />
        <path
          d="M11.5 23.5V10.5l11 13V10.5"
          stroke="#e8c15a"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="block text-lg font-extrabold tracking-[0.28em] text-foreground">
            NEXORA
          </span>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.32em] text-muted">
            Social World
          </span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const lp = levelProgress(profile.xp);
  const isStaff = ["admin", "owner", "moderator"].includes(profile.role);

  const items = [
    ...NAV,
    ...(isStaff
      ? [{ href: "/admin", label: "Admin", icon: Shield, phase: 0 } as const]
      : []),
  ];

  const sidebar = (
    <div className="flex h-full w-[264px] flex-col border-r border-line bg-panel">
      <div className="flex h-16 items-center border-b border-line px-5">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-white/5 hover:text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className={active ? "text-accent" : "text-muted group-hover:text-foreground"}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.phase > 0 && (
                    <span className="rounded-md border border-line bg-panel2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">
                      P{item.phase}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* XP / level block */}
      <div className="border-t border-line px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Level {lp.level}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold">
            <Coins size={12} strokeWidth={2} /> {profile.coins}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-panel3"
          role="progressbar"
          aria-valuenow={lp.intoLevel}
          aria-valuemin={0}
          aria-valuemax={lp.needed}
          aria-label="XP progress to next level"
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${lp.pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] tabular-nums text-muted">
          {lp.intoLevel} / {lp.needed} XP
        </p>
      </div>

      {/* user row */}
      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
        <Image
          src={profile.avatar_url}
          alt="Your avatar"
          width={38}
          height={38}
          className="pixelated h-[38px] w-[38px] rounded-full border border-line object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
            {profile.display_name}
          </p>
          <p className="truncate text-[11px] text-muted">@{profile.username}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <LogOut size={17} strokeWidth={1.8} />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-graphite/85 px-4 backdrop-blur-md md:hidden">
        <Logo />
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="rounded-lg border border-line bg-panel2 p-2 text-foreground"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">{sidebar}</aside>

      {/* mobile drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 shadow-2xl md:hidden">{sidebar}</aside>
        </>
      )}

      <main className="md:pl-[264px]">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
