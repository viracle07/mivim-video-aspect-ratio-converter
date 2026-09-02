import { conversionJobs } from "@/lib/mock-data";

export const workspaceStorageKey = "mivim-workspace";

export function createWorkspace(user) {
  return {
    profile: {
      displayName: user?.displayName || user?.email?.split("@")[0] || "Creator",
      studioName: "",
      email: user?.email || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    },
    plan: user?.plan || "trial",
    trialEndsAt: user?.trialEndsAt || null,
    jobs: conversionJobs
  };
}

export function getWorkspaceStats(workspace) {
  const jobs = workspace?.jobs || [];
  const completed = jobs.filter((job) => job.status === "completed").length;
  const active = jobs.filter((job) => ["queued", "processing"].includes(job.status)).length;
  const storageMb = jobs.reduce((total, job) => total + Number.parseFloat(job.size || 0), 0);
  const trialEnd = workspace?.trialEndsAt ? new Date(workspace.trialEndsAt) : null;
  const trialDays = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 14;
  return { completed, active, total: jobs.length, storageMb, trialDays };
}

export function formatStorage(megabytes) {
  return megabytes >= 1024 ? `${(megabytes / 1024).toFixed(1)} GB` : `${Math.round(megabytes)} MB`;
}
