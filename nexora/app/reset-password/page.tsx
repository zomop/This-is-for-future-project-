import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "./reset-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Lost your way?"
      subtitle="We'll send a reset link to your email. The link returns you here to set a new password."
    >
      <ResetForm />
      <p className="mt-5 text-sm text-muted">
        Remembered it after all?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
