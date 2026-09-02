"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  const value = useMemo(() => ({
    workspace,
    updateProfile(profile) {
      const nextWorkspace = { ...workspace, profile: { ...workspace.profile, ...profile } };
      window.localStorage.setItem(`${workspaceStorageKey}:${user.uid}`, JSON.stringify(nextWorkspace));
      setWorkspace(nextWorkspace);
      return nextWorkspace;
    }
  }), [user, workspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
