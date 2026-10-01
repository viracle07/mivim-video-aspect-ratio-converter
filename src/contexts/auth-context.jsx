"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { demoUser } from "@/lib/mock-data";
import { firebaseAuth } from "@/lib/firebase";

const AuthContext = createContext(null);

function normalizeUser(firebaseUser, fallback = {}) {
  const email = firebaseUser?.email || fallback.email || demoUser.email;
  return { ...demoUser, ...fallback, uid: firebaseUser?.uid || fallback.uid, email, displayName: firebaseUser?.displayName || fallback.displayName || email.split("@")[0], emailVerified: Boolean(firebaseUser?.emailVerified ?? fallback.emailVerified), provider: fallback.provider || "google" };
}

function safeNextPath(value) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

async function createFirebaseSession(firebaseUser) {
  const idToken = await firebaseAuth.getIdToken(firebaseUser, true);
  const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid: firebaseUser.uid, email: firebaseUser.email, idToken }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Google sign-in could not be completed.");
  return normalizeUser(firebaseUser, { role: result.role, provider: "google", emailVerified: true });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const enterApp = useCallback((nextUser) => {
    setUser(nextUser);
    setAuthError("");
    if (pathname === "/login" || pathname === "/signup") {
      router.replace(safeNextPath(new URLSearchParams(window.location.search).get("next")));
      router.refresh();
    }
  }, [pathname, router]);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    async function startAuth() {
      try {
        await firebaseAuth.completeGoogleRedirect();
      } catch (error) {
        if (active) setAuthError(error.message || "Google sign-in could not be completed.");
      }
      unsubscribe = firebaseAuth.watch(async (firebaseUser) => {
        if (!active) return;
        try {
          if (firebaseUser) {
            enterApp(await createFirebaseSession(firebaseUser));
          } else {
            const response = await fetch("/api/auth/session", { cache: "no-store" });
            const result = await response.json().catch(() => ({}));
            setUser(response.ok && result.authenticated ? normalizeUser(null, result.user) : null);
          }
        } catch (error) {
          setUser(null);
          setAuthError(error.message || "Google sign-in could not be completed.");
        } finally {
          if (active) setLoading(false);
        }
      });
    }

    startAuth();
    return () => { active = false; unsubscribe(); };
  }, [enterApp]);

  const value = useMemo(() => ({
    user,
    loading,
    authError,
    async googleLogin() { setAuthError(""); await firebaseAuth.signInWithGoogle(); },
    async login(email, password, nextPath = "/dashboard", requireAdmin = false) {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, admin: requireAdmin }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Login failed.");
      setUser(normalizeUser(null, result));
      router.replace(safeNextPath(nextPath));
      router.refresh();
    },
    async logout() { await firebaseAuth.signOut(); await fetch("/api/auth/session", { method: "DELETE" }); setUser(null); router.replace("/"); router.refresh(); },
    async resendVerification() { return true; },
    async refreshUser() { return user; }
  }), [authError, loading, router, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
