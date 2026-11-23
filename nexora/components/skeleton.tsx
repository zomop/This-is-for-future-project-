import { cn } from "@/lib/utils";

/**
 * Loading-skeleton primitives shown by route-level `loading.tsx` files while
 * server data streams in. Pure CSS pulse blocks — no client JS, so the shell
 * arrives immediately and prefetching links on hover/viewport makes navigation
 * feel instant even on slow connections.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-2xl bg-panel2/70", className)}
    />
  );
}

export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col gap-4"
    >
      <span className="sr-only">Loading page…</span>
      {children}
    </div>
  );
}
