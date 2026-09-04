"use client";

import { useState } from "react";
import Link from "next/link";
import { Chrome, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { hasFirebaseConfig } from "@/lib/env";

export function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup, googleLogin, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "reset") {
        await resetPassword(email);
        setMessage("Password reset email sent.");
      } else if (isSignup) {
        await signup(email, password);
      } else {
        const requestedPath = new URLSearchParams(window.location.search).get("next");
        const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/dashboard";
        await login(email, password, nextPath);
      }
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setBusy(true);
    setMessage("");
    try {
      await googleLogin();
    } catch (error) {
      const setupErrors = ["auth/internal-error", "auth/operation-not-allowed", "auth/unauthorized-domain"];
      setMessage(setupErrors.includes(error.code)
        ? "Google sign-in is not enabled for this website. Check the Google provider and authorized domains in Firebase Authentication."
        : error.code === "auth/popup-blocked" ? "Your browser blocked the Google sign-in window. Allow popups and try again."
          : error.code === "auth/popup-closed-by-user" ? "Google sign-in was cancelled." : error.message || "Google sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <h1 className="text-2xl font-semibold">{isSignup ? "Create your account" : mode === "reset" ? "Reset password" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {isSignup ? "Start your MiVim free trial and verify your email." : mode === "reset" ? "We will send reset instructions." : "Log in to continue converting videos."}
        </p>
      </CardHeader>
      <CardContent>
        {!hasFirebaseConfig && <p className="mb-4 rounded-md border border-amber/40 bg-amber/15 px-3 py-2 text-sm text-ink/70">Local preview mode is active. Account data stays in this browser until Firebase is connected.</p>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Email
            <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          {mode !== "reset" && (
            <label className="block text-sm font-medium">
              Password
              <Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            </label>
          )}
          {message && <p className="rounded-md bg-amber/20 px-3 py-2 text-sm text-ink/75">{message}</p>}
          <Button className="w-full" disabled={busy}>
            <Mail className="h-4 w-4" />
            {busy ? "Working..." : isSignup ? "Create account" : mode === "reset" ? "Send reset email" : "Log in"}
          </Button>
        </form>
        {mode !== "reset" && (
          <Button className="mt-3 w-full" variant="secondary" onClick={handleGoogleLogin} disabled={!hasFirebaseConfig || busy} title={!hasFirebaseConfig ? "Connect Firebase to enable Google sign-in" : undefined}>
            <Chrome className="h-4 w-4" />
            Continue with Google
          </Button>
        )}
        <div className="mt-5 flex justify-between text-sm">
          <Link className="text-mivim-600" href={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Already have an account?" : "Create account"}
          </Link>
          {mode !== "reset" && (
            <Link className="text-ink/60" href="/reset-password">
              Forgot password?
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
