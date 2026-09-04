export const workspaceStorageKey = "mivim-workspace";
const prototypeJobIds = new Set(["job_1042", "job_1041", "job_1038"]);

export const freeUploadLimit = 3;

export function createWorkspace(user) {
  return {
    profile: {
      displayName: user?.displayName || user?.email?.split("@")[0] || "Creator",
      studioName: "",
      email: user?.email || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    },
    plan: user?.plan || "trial",
    billingVersion: 2,
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
    billingVersion: 2,
    dataVersion: 1,
    contentUpdatedAt: workspace.contentUpdatedAt || null,
    billing: workspace.billing || null,
    jobs
  };
}

export function hasWorkspaceAccess(workspace) {
  if (!workspace) return false;
  if (["monthly", "yearly"].includes(workspace.plan) && workspace.billing?.status === "active") return true;
  return workspace.plan === "trial" && getFreeUploadsUsed(workspace) < freeUploadLimit;
}

export function getFreeUploadsUsed(workspace) {
  return (workspace?.jobs || []).filter((job) => job.sourceStorage).length;
}

export function getWorkspaceStats(workspace) {
  const jobs = workspace?.jobs || [];
  const completed = jobs.filter((job) => job.status === "completed").length;
  const active = jobs.filter((job) => ["queued", "processing"].includes(job.status)).length;
  const storageMb = jobs.reduce((total, job) => total + Number.parseFloat(job.size || 0), 0);
  const freeUploadsUsed = getFreeUploadsUsed(workspace);
  const freeUploadsRemaining = Math.max(0, freeUploadLimit - freeUploadsUsed);
  return { completed, active, total: jobs.length, storageMb, freeUploadsUsed, freeUploadsRemaining };
}

export function formatStorage(megabytes) {
  return megabytes >= 1024 ? `${(megabytes / 1024).toFixed(1)} GB` : `${Math.round(megabytes)} MB`;
}
