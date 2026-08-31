"use client";

import Link from "next/link";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function VerificationBanner() {
  const { user, resendVerification } = useAuth();

  if (!user || user.emailVerified) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber/40 bg-amber/15 px-4 py-3">
      <div className="flex items-center gap-3">
        <MailWarning className="h-5 w-5 text-ink/70" />
        <p className="text-sm text-ink/75">Verify {user.email} to keep uploads, history, and billing protected.</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={resendVerification}>Resend</Button>
        <Button asChild size="sm" href="/verify-email">Verify</Button>
      </div>
    </div>
  );
}
