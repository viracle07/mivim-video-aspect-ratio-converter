"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createWorkspace, workspaceStorageKey } from "@/lib/workspace";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    if (!user) return;
    const key = `${workspaceStorageKey}:${user.uid}`;
    const stored = window.localStorage.getItem(key);
    setWorkspace(stored ? JSON.parse(stored) : createWorkspace(user));
  }, [user]);

  const changeWorkspace = useCallback((recipe) => {
    setWorkspace((current) => {
      if (!current) return current;
      const nextWorkspace = recipe(current);
      window.localStorage.setItem(`${workspaceStorageKey}:${user.uid}`, JSON.stringify(nextWorkspace));
      return nextWorkspace;
    });
  }, [user?.uid]);

  const value = useMemo(() => ({
    workspace,
    addJob(job) {
      changeWorkspace((current) => ({ ...current, jobs: [job, ...(current.jobs || [])] }));
    },
    updateJob(jobId, changes) {
      changeWorkspace((current) => ({ ...current, jobs: (current.jobs || []).map((job) => job.id === jobId ? { ...job, ...changes } : job) }));
    },
    removeJob(jobId) {
      changeWorkspace((current) => ({ ...current, jobs: (current.jobs || []).filter((job) => job.id !== jobId) }));
    },
    updateProfile(profile) {
      changeWorkspace((current) => ({ ...current, profile: { ...current.profile, ...profile } }));
    }
  }), [changeWorkspace, workspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
