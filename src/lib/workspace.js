import { conversionJobs } from "@/lib/mock-data";

export const workspaceStorageKey = "mivim-workspace";

function newTrialEnd() {
  return new Date(Date.now() + 14 * 86400000).toISOString();
}

export function createWorkspace(user) {
  return {
    profile: {
      displayName: user?.displayName || user?.email?.split("@")[0] || "Creator",
      studioName: "",
      email: user?.email || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    },
    plan: user?.plan || "trial",
    trialEndsAt: user?.trialEndsAt || newTrialEnd(),
    billingVersion: 1,
    billing: null,
    jobs: conversionJobs
  };
}

export function migrateWorkspace(workspace) {
  if (workspace.billingVersion === 1) return workspace;
  return {
    ...workspace,
    billingVersion: 1,
    trialEndsAt: workspace.plan === "trial" ? newTrialEnd() : workspace.trialEndsAt,
    billing: workspace.billing || null
  };
}

export function hasWorkspaceAccess(workspace) {
  if (!workspace) return false;
  if (["monthly", "yearly"].includes(workspace.plan) && workspace.billing?.status === "active") return true;
  return workspace.plan === "trial" && new Date(workspace.trialEndsAt).getTime() > Date.now();
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
