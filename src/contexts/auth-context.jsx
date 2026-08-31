"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { demoUser } from "@/lib/mock-data";
import { firebaseAuth } from "@/lib/firebase";

const AuthContext = createContext(null);
const storageKey = "mivim-user";
const sessionCookie = "mivim-session=active; path=/; max-age=1209600; SameSite=Lax";
const expiredSessionCookie = "mivim-session=; path=/; max-age=0; SameSite=Lax";

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

function persistUser(user) {
  window.localStorage.setItem(storageKey, JSON.stringify(user));
  document.cookie = sessionCookie;
}

function clearPersistedUser() {
  window.localStorage.removeItem(storageKey);
  document.cookie = expiredSessionCookie;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (stored) {
      setUser(JSON.parse(stored));
      document.cookie = sessionCookie;
    }

    const unsubscribe = firebaseAuth.watch((firebaseUser) => {
      if (firebaseUser) {
        const nextUser = normalizeUser(firebaseUser);
        persistUser(nextUser);
        setUser(nextUser);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email, password, nextPath = "/dashboard") {
        const signedIn = await firebaseAuth.signIn(email, password);
        const nextUser = normalizeUser(signedIn, { email, emailVerified: signedIn.emailVerified ?? true });
        persistUser(nextUser);
        setUser(nextUser);
        router.push(nextPath);
      },
      async signup(email, password) {
        const signedUp = await firebaseAuth.signUp(email, password);
        const nextUser = normalizeUser(signedUp, { email, displayName: email.split("@")[0], emailVerified: signedUp.emailVerified ?? false });
        persistUser(nextUser);
        setUser(nextUser);
        router.push("/verify-email");
      },
      async googleLogin() {
        const signedIn = await firebaseAuth.signInWithGoogle();
        const nextUser = normalizeUser(signedIn, { provider: "google", emailVerified: true });
        persistUser(nextUser);
        setUser(nextUser);
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
        persistUser(nextUser);
        setUser(nextUser);
        return nextUser;
      },
      async logout() {
        await firebaseAuth.signOut();
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
