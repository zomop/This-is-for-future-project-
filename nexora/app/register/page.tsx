import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "./register-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Forge your legend."
      subtitle="One account. One world. XP, achievements, friends and the Field of the Fallen Sword."
    >
      <RegisterForm />
      <p className="mt-5 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
