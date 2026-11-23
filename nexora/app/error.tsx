"use client";

import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("NEXORA route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-bad">Something broke</p>
      <h1 className="text-2xl font-extrabold text-foreground">An unexpected error occurred.</h1>
      <p className="max-w-md text-sm text-muted">
        {error.message || "Unknown error"} — you can try again, and if it persists,
        the team will see it in the logs.
      </p>
      <button onClick={reset} className={cn(buttonVariants({ variant: "accent" }))}>
        Try again
      </button>
    </main>
  );
}
