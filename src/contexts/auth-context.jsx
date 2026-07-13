"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { demoUser } from "@/lib/mock-data";
import { firebaseAuth } from "@/lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("mivim-user") : null;
    if (stored) setUser(JSON.parse(stored));

    const unsubscribe = firebaseAuth.watch((firebaseUser) => {
      if (firebaseUser) {
        const nextUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
          emailVerified: firebaseUser.emailVerified,
          plan: "trial"
        };
        window.localStorage.setItem("mivim-user", JSON.stringify(nextUser));
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
      async login(email, password) {
        const signedIn = await firebaseAuth.signIn(email, password);
        const nextUser = { ...demoUser, email: signedIn.email, displayName: signedIn.displayName || "MiVim User" };
        window.localStorage.setItem("mivim-user", JSON.stringify(nextUser));
        setUser(nextUser);
        router.push("/dashboard");
      },
      async signup(email, password) {
        const signedUp = await firebaseAuth.signUp(email, password);
        const nextUser = { ...demoUser, email: signedUp.email, displayName: signedUp.displayName || "New Creator" };
        window.localStorage.setItem("mivim-user", JSON.stringify(nextUser));
        setUser(nextUser);
        router.push("/dashboard");
      },
      async googleLogin() {
        const signedIn = await firebaseAuth.signInWithGoogle();
        const nextUser = { ...demoUser, email: signedIn.email, displayName: signedIn.displayName || "Google User" };
        window.localStorage.setItem("mivim-user", JSON.stringify(nextUser));
        setUser(nextUser);
        router.push("/dashboard");
      },
      async resetPassword(email) {
        return firebaseAuth.resetPassword(email);
      },
      async logout() {
        await firebaseAuth.signOut();
        window.localStorage.removeItem("mivim-user");
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
