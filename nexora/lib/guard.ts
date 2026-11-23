import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/data";
import type { Profile } from "@/lib/types";

/** Server-side guard: loads the caller's profile or redirects to /login. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  return profile;
}
