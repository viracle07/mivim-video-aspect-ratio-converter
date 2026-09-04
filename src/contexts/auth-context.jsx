"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { demoUser } from "@/lib/mock-data";
import { firebaseAuth } from "@/lib/firebase";
import { hasFirebaseConfig } from "@/lib/env";

const AuthContext = createContext(null);
const storageKey = "mivim-user";
const authSourceKey = "mivim-auth-source";

function normalizeUser(firebaseUser, fallback = {}) {
  const email = firebaseUser?.email || fallback.email || demoUser.email;
  return {
    ...demoUser,
    ...fallback,
    uid: firebaseUser?.uid || fallback.uid || `local-${email}`,
    email,
    displayName: firebaseUser?.displayName || fallback.displayName || email.split("@")[0],
    emailVerified: Boolean(firebaseUser?.emailVerified ?? fallback.emailVerified),
    provider: fallback.provider || "password"
  };
}

async function persistUser(user) {
  const idToken = await firebaseAuth.getIdToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: user.uid, email: user.email, idToken })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Your session could not be secured.");
  const nextUser = { ...user, role: result.role };
  window.localStorage.setItem(storageKey, JSON.stringify(nextUser));
  return nextUser;
}

function clearPersistedUser() {
  window.localStorage.removeItem(storageKey);
  window.localStorage.removeItem(authSourceKey);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    const restorePromise = (async () => {
      if (!stored) return;
      const storedUser = JSON.parse(stored);
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !result.authenticated) throw new Error("Session expired");
        const nextUser = { ...storedUser, ...result.user };
        window.localStorage.setItem(storageKey, JSON.stringify(nextUser));
        setUser(nextUser);
        return true;
      } catch {
        clearPersistedUser();
        return false;
      }
    })();

    let unsubscribe = () => {};
    try {
      unsubscribe = firebaseAuth.watch(async (firebaseUser) => {
        if (window.localStorage.getItem(authSourceKey) === "server") {
          await restorePromise;
          setLoading(false);
          return;
        }
        if (firebaseUser) {
          const nextUser = normalizeUser(firebaseUser);
          try { setUser(await persistUser(nextUser)); } catch { setUser(null); }
        } else {
          const restored = await restorePromise;
          if (hasFirebaseConfig && !restored) {
            await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
            clearPersistedUser();
            setUser(null);
          }
        }
        setLoading(false);
      });
    } catch {
      restorePromise.finally(() => setLoading(false));
    }

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email, password, nextPath = "/dashboard", requireAdmin = false) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, admin: requireAdmin })
        });
        const signedIn = await response.json();
        if (!response.ok) throw new Error(signedIn.error || "Login failed.");
        const sessionUser = normalizeUser(signedIn, signedIn);
        window.localStorage.setItem(storageKey, JSON.stringify(sessionUser));
        window.localStorage.setItem(authSourceKey, "server");
        setUser(sessionUser);
        router.push(nextPath);
      },
      async signup(email, password) {
        const signedUp = await firebaseAuth.signUp(email, password);
        const nextUser = normalizeUser(signedUp, { email, displayName: email.split("@")[0], emailVerified: signedUp.emailVerified ?? false });
        const sessionUser = await persistUser(nextUser);
        window.localStorage.setItem(authSourceKey, "firebase");
        setUser(sessionUser);
        router.push("/verify-email");
      },
      async googleLogin() {
        const signedIn = await firebaseAuth.signInWithGoogle();
        const nextUser = normalizeUser(signedIn, { provider: "google", emailVerified: true });
        const sessionUser = await persistUser(nextUser);
        window.localStorage.setItem(authSourceKey, "firebase");
        setUser(sessionUser);
        router.push("/dashboard");
      },
      async resetPassword(email) {
        return firebaseAuth.resetPassword(email);
      },
      async resendVerification() {
        await firebaseAuth.resendVerification();
        return true;
      },
      async refreshUser() {
        const refreshed = await firebaseAuth.refreshUser();
        const nextUser = normalizeUser(refreshed, { ...user, emailVerified: refreshed?.emailVerified ?? user?.emailVerified });
        const sessionUser = await persistUser(nextUser);
        setUser(sessionUser);
        return sessionUser;
      },
      async logout() {
        await firebaseAuth.signOut();
        await fetch("/api/auth/session", { method: "DELETE" });
        clearPersistedUser();
        setUser(null);
        router.push("/");
      }
    }),
    [loading, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
