export const workspaceStorageKey = "mivim-workspace";
const prototypeJobIds = new Set(["job_1042", "job_1041", "job_1038"]);

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
    dataVersion: 1,
    contentUpdatedAt: null,
    billing: null,
    jobs: []
  };
}

export function migrateWorkspace(workspace) {
  const storedJobs = workspace.dataVersion === 1 ? (workspace.jobs || []) : (workspace.jobs || []).filter((job) => !prototypeJobIds.has(job.id));
  const jobs = storedJobs.map((job) => job.status === "processing" ? {
    ...job,
    status: "failed",
    progress: 0,
    error: "The previous conversion was interrupted. Select Retry to continue."
  } : job);
  return {
    ...workspace,
    billingVersion: 1,
    dataVersion: 1,
    contentUpdatedAt: workspace.contentUpdatedAt || null,
    trialEndsAt: workspace.billingVersion === 1 ? workspace.trialEndsAt : workspace.plan === "trial" ? newTrialEnd() : workspace.trialEndsAt,
    billing: workspace.billing || null,
    jobs
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
