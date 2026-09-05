"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createWorkspace, migrateWorkspace, workspaceStorageKey } from "@/lib/workspace";
import { loadCloudWorkspace, saveCloudWorkspace } from "@/lib/workspace-cloud";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [cloudStatus, setCloudStatus] = useState("loading");

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const key = `${workspaceStorageKey}:${user.uid}`;
    const stored = window.localStorage.getItem(key);
    const localWorkspace = stored ? migrateWorkspace(JSON.parse(stored)) : createWorkspace(user);
    window.localStorage.setItem(key, JSON.stringify(localWorkspace));
    setWorkspace(localWorkspace);

    (async () => {
      try {
        const [cloud, entitlementResponse] = await Promise.all([
          loadCloudWorkspace(user.uid),
          fetch("/api/account/entitlement", { cache: "no-store" })
        ]);
        const entitlement = entitlementResponse.ok ? await entitlementResponse.json() : null;
        if (!active) return;
        if (!cloud) {
          const saved = await saveCloudWorkspace(user.uid, localWorkspace);
          if (entitlement) {
            const nextWorkspace = { ...localWorkspace, plan: entitlement.plan, entitlement, billing: entitlement.paid ? { ...(localWorkspace.billing || {}), status: entitlement.status, expiresAt: entitlement.expiresAt } : localWorkspace.billing };
            window.localStorage.setItem(key, JSON.stringify(nextWorkspace));
            setWorkspace(nextWorkspace);
          }
          if (active) setCloudStatus(saved ? "synced" : "local");
          return;
        }
        const cloudIsNewer = (cloud.contentUpdatedAt || "") > (localWorkspace.contentUpdatedAt || "");
        let nextWorkspace = cloudIsNewer
          ? migrateWorkspace({ ...localWorkspace, profile: cloud.profile || localWorkspace.profile, jobs: cloud.jobs || [], dataVersion: cloud.dataVersion || 1, contentUpdatedAt: cloud.contentUpdatedAt })
          : localWorkspace;
        if (entitlement) nextWorkspace = { ...nextWorkspace, plan: entitlement.plan, entitlement, billing: entitlement.paid ? { ...(nextWorkspace.billing || {}), status: entitlement.status, expiresAt: entitlement.expiresAt } : nextWorkspace.billing };
        if (cloudIsNewer || entitlement) {
          window.localStorage.setItem(key, JSON.stringify(nextWorkspace));
          setWorkspace(nextWorkspace);
        }
        if (!cloudIsNewer && (localWorkspace.contentUpdatedAt || "") > (cloud.contentUpdatedAt || "")) {
          await saveCloudWorkspace(user.uid, localWorkspace);
        }
        if (active) setCloudStatus("synced");
      } catch {
        if (active) setCloudStatus("offline");
      }
    })();
    return () => { active = false; };
  }, [user]);

  const changeWorkspace = useCallback((recipe) => {
    setWorkspace((current) => {
      if (!current) return current;
      const nextWorkspace = { ...recipe(current), contentUpdatedAt: new Date().toISOString() };
      window.localStorage.setItem(`${workspaceStorageKey}:${user.uid}`, JSON.stringify(nextWorkspace));
      setCloudStatus("saving");
      saveCloudWorkspace(user.uid, nextWorkspace)
        .then((saved) => setCloudStatus(saved ? "synced" : "local"))
        .catch(() => setCloudStatus("offline"));
      return nextWorkspace;
    });
  }, [user?.uid]);

  const value = useMemo(() => ({
    workspace,
    cloudStatus,
    addJob(job) {
      changeWorkspace((current) => ({ ...current, jobs: [job, ...(current.jobs || [])] }));
    },
    updateJob(jobId, changes) {
      changeWorkspace((current) => ({ ...current, jobs: (current.jobs || []).map((job) => job.id === jobId ? { ...job, ...changes } : job) }));
    },
    removeJob(jobId) {
      changeWorkspace((current) => ({ ...current, jobs: (current.jobs || []).filter((job) => job.id !== jobId) }));
    },
    activatePlan(plan, billing) {
      changeWorkspace((current) => ({ ...current, plan, entitlement: { ...(current.entitlement || {}), plan, paid: true, status: "active", freeUploadsUsed: current.entitlement?.freeUploadsUsed || 0 }, billing: { ...billing, status: "active" } }));
    },
    updateProfile(profile) {
      changeWorkspace((current) => ({ ...current, profile: { ...current.profile, ...profile } }));
    }
  }), [changeWorkspace, cloudStatus, workspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
