"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Chrome, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { hasFirebaseConfig } from "@/lib/env";

export function AuthForm({ mode }) {
  const isAdmin = mode === "admin";
  const { user, loading, authError, login, googleLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAdmin && !loading && user) { router.replace("/dashboard"); router.refresh(); }
  }, [isAdmin, loading, router, user]);

  async function handleGoogleLogin() {
    setBusy(true);
    setMessage("");
    try { await googleLogin(); }
    catch (error) { setMessage(error.message || "Google sign-in could not be started."); setBusy(false); }
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try { await login(email, password, "/dashboard/admin", true); }
    catch (error) { setMessage(error.message || "Administrator login failed."); setBusy(false); }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <h1 className="text-2xl font-semibold">{isAdmin ? "Administrator sign in" : "Continue to Mivim"}</h1>
        <p className="mt-1 text-sm text-ink/60">{isAdmin ? "Access Mivim platform operations." : "Use your Google account to access the video resizer."}</p>
      </CardHeader>
      <CardContent>
        {(message || authError) && <p className="mb-4 rounded-md bg-amber/20 px-3 py-2 text-sm text-ink/75">{message || authError}</p>}
        {isAdmin ? (
          <form className="space-y-4" onSubmit={handleAdminLogin}>
            <label className="block text-sm font-medium">Email<Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label className="block text-sm font-medium">Password<Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
            <Button className="w-full" disabled={busy}><Mail className="h-4 w-4" />{busy ? "Signing in..." : "Sign in as administrator"}</Button>
          </form>
        ) : (
          <Button className="w-full" onClick={handleGoogleLogin} disabled={!hasFirebaseConfig || busy || loading}><Chrome className="h-4 w-4" />{busy ? "Opening Google..." : "Continue with Google"}</Button>
        )}
      </CardContent>
    </Card>
  );
}
