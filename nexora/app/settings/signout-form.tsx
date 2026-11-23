"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutForm() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="danger" size="md">
        <LogOut size={16} /> Sign out
      </Button>
    </form>
  );
}
