import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact relative time for feed rows ("just now", "5m", "3h", "2d", "3w"). */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return new Date(then).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Escape user input for use inside a PostgREST `or()` + ilike pattern.
 * - escapes the LIKE escape char and wildcards (\ % _)
 * - replaces characters structural to the or() DSL ( ( ) , " ) with spaces
 * - collapses whitespace; `*` is left alone as the caller's explicit wildcard
 */
export function escapeLikePattern(raw: string): string {
  return raw
    .replace(/[\\%_]/g, (m) => `\\${m}`)
    .replace(/[(),"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Map a friendship row (or its absence) to the viewer's relation to the other
 * person. Declined and blocked pairs read as "none" — Discover never surfaces
 * block state. `iAmRequester` is true when the viewer created the friendship row.
 */
export function friendRelation(
  status: "pending" | "accepted" | "declined" | "blocked" | null | undefined,
  iAmRequester: boolean
): "friend" | "requested" | "incoming" | "none" {
  if (status === "accepted") return "friend";
  if (status === "pending") return iAmRequester ? "requested" : "incoming";
  return "none";
}
