import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Welcome back, traveler."
      subtitle="Sign in to reach your profile, friends, messages and the World."
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-panel2" />}>
        <LoginForm next={next ?? "/home"} />
      </Suspense>
      <p className="mt-5 text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>{" "}
        ·{" "}
        <Link href="/reset-password" className="font-semibold text-accent hover:underline">
          Reset password
        </Link>
      </p>
    </AuthShell>
  );
}
