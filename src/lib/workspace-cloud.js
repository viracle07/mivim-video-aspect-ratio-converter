"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "@firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase";

function cloudDocument(uid) {
  const { database } = getFirebaseServices();
  return database ? doc(database, "users", uid) : null;
}

export async function loadCloudWorkspace(uid) {
  const reference = cloudDocument(uid);
  if (!reference) return null;
  const snapshot = await getDoc(reference);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveCloudWorkspace(uid, workspace) {
  const reference = cloudDocument(uid);
  if (!reference) return false;
  await setDoc(reference, {
    profile: workspace.profile,
    jobs: workspace.jobs || [],
    dataVersion: workspace.dataVersion || 1,
    contentUpdatedAt: workspace.contentUpdatedAt || new Date().toISOString(),
    syncedAt: serverTimestamp()
  }, { merge: true });
  return true;
}
