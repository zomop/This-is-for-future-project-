import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent">404</p>
      <h1 className="text-3xl font-extrabold text-foreground">This path leads nowhere.</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you&apos;re looking for wandered off into the field. Let&apos;s get you home.
      </p>
      <Link href="/home" className={cn(buttonVariants({ variant: "accent" }))}>
        Back to Home
      </Link>
    </main>
  );
}
