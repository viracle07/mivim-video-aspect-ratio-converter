"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { firebaseConfig, hasFirebaseConfig } from "@/lib/env";

export function getFirebaseApp() {
  if (!hasFirebaseConfig) return null;
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export function getFirebaseServices() {
  const app = getFirebaseApp();
  if (!app) return { app: null, auth: null };
  return {
    app,
    auth: getAuth(app)
  };
}

export const firebaseAuth = {
  async signUp(email, password) {
    const { auth } = getFirebaseServices();
    if (!auth) return { email, displayName: email.split("@")[0], emailVerified: false };
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
    return credential.user;
  },
  async signIn(email, password) {
    const { auth } = getFirebaseServices();
    if (!auth) return { email, displayName: email.split("@")[0], emailVerified: true };
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  },
  async signInWithGoogle() {
    const { auth } = getFirebaseServices();
    if (!auth) return { email: "google-user@example.com", displayName: "Google User", emailVerified: true };
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    return credential.user;
  },
  async resetPassword(email) {
    const { auth } = getFirebaseServices();
    if (!auth) return true;
    await sendPasswordResetEmail(auth, email);
    return true;
  },
  async signOut() {
    const { auth } = getFirebaseServices();
    if (!auth) return true;
    await signOut(auth);
    return true;
  },
  watch(callback) {
    const { auth } = getFirebaseServices();
    if (!auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
};
