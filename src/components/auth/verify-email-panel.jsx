"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MailCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export function VerifyEmailPanel() {
  const { user, resendVerification, refreshUser, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleResend() {
    setBusy(true);
    setMessage("");
    try {
      await resendVerification();
      setMessage("Verification email sent. Check your inbox.");
    } catch (error) {
      setMessage(error.message || "Unable to send verification email.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    setBusy(true);
    setMessage("");
    try {
      const refreshed = await refreshUser();
      setMessage(refreshed.emailVerified ? "Email verified. You can continue." : "Still waiting for verification.");
    } catch (error) {
      setMessage(error.message || "Unable to refresh verification status.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold">Sign in required</h1>
          <p className="mt-1 text-sm text-ink/60">Log in to verify your MiVim account.</p>
        </CardHeader>
        <CardContent>
          <Button asChild href="/login" className="w-full">Log in</Button>
        </CardContent>
      </Card>
    );
  }

  if (user.emailVerified) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CheckCircle2 className="mb-3 h-8 w-8 text-mivim-600" />
          <h1 className="text-2xl font-semibold">Email verified</h1>
          <p className="mt-1 text-sm text-ink/60">Your account is ready for protected MiVim workflows.</p>
        </CardHeader>
        <CardContent>
          <Button asChild href="/dashboard" className="w-full">Continue to dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <MailCheck className="mb-3 h-8 w-8 text-mivim-600" />
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p className="mt-1 text-sm text-ink/60">We sent a verification link to {user.email}.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {message && <p className="rounded-md bg-amber/20 px-3 py-2 text-sm text-ink/75">{message}</p>}
        <Button className="w-full" onClick={handleRefresh} disabled={busy}>
          <RefreshCw className="h-4 w-4" />
          I verified my email
        </Button>
        <Button className="w-full" variant="secondary" onClick={handleResend} disabled={busy}>
          Resend verification email
        </Button>
        <div className="flex justify-between pt-2 text-sm">
          <Link className="text-mivim-600" href="/dashboard">Go to dashboard</Link>
          <button className="text-ink/60" type="button" onClick={logout}>Sign out</button>
        </div>
      </CardContent>
    </Card>
  );
}
