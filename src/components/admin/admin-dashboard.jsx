"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Database, Download, FileVideo, LoaderCircle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { formatStorage, getWorkspaceStats, hasWorkspaceAccess } from "@/lib/workspace";

const statusTone = {
  completed: "text-mivim-600",
  processing: "text-amber-700",
  queued: "text-ink/55",
  failed: "text-coral"
};

function formatBytes(bytes) {
  if (!bytes) return "Not available";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [paystackReady, setPaystackReady] = useState(null);

  useEffect(() => {
    fetch("/api/paystack/status").then((response) => response.json()).then((result) => setPaystackReady(result.configured)).catch(() => setPaystackReady(false));
  }, []);

  const report = useMemo(() => {
    if (!workspace) return null;
    const stats = getWorkspaceStats(workspace);
    const failed = workspace.jobs.filter((job) => job.status === "failed").length;
    const outputBytes = workspace.jobs.reduce((total, job) => total + Number(job.outputBytes || 0), 0);
    return { stats, failed, outputBytes, access: hasWorkspaceAccess(workspace) };
  }, [workspace]);

  if (!workspace || !report) return <div className="h-64 animate-pulse rounded-lg bg-white" />;

  function exportReport() {
    const payload = {
      generatedAt: new Date().toISOString(),
      account: { uid: user.uid, email: user.email, emailVerified: user.emailVerified, plan: workspace.plan },
      profile: workspace.profile,
      billing: workspace.billing ? { status: workspace.billing.status, currency: workspace.billing.currency, paidAt: workspace.billing.paidAt, reference: workspace.billing.reference } : null,
      summary: report,
      jobs: workspace.jobs.map(({ id, fileName, status, targetRatio, progress, size, resolution, durationLabel, createdAt, completedAt }) => ({ id, fileName, status, targetRatio, progress, size, resolution, durationLabel, createdAt, completedAt }))
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mivim-admin-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const cards = [
    { label: "Workspace users", value: "1", note: user.emailVerified ? "Email verified" : "Verification pending", icon: UserRound },
    { label: "Conversions", value: String(report.stats.total), note: `${report.stats.completed} completed`, icon: FileVideo },
    { label: "Source storage", value: formatStorage(report.stats.storageMb), note: `${formatBytes(report.outputBytes)} converted output`, icon: Database },
    { label: "Subscription", value: workspace.plan === "trial" ? "Trial" : workspace.plan === "yearly" ? "Yearly" : "Monthly", note: report.access ? "Access enabled" : "Access expired", icon: CircleDollarSign }
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Admin operations</h1><p className="mt-1 text-ink/60">Live workspace health, billing readiness, and conversion activity.</p></div><Button variant="secondary" onClick={exportReport}><Download className="h-4 w-4" />Export report</Button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((item) => { const Icon = item.icon; return <Card key={item.label}><CardContent><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-ink/55">{item.label}</p><p className="mt-2 text-2xl font-semibold">{item.value}</p></div><div className="grid h-9 w-9 place-items-center rounded-md bg-mist text-mivim-600"><Icon className="h-4 w-4" /></div></div><p className="mt-2 text-sm text-ink/55">{item.note}</p></CardContent></Card>; })}</div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Recent system activity</h2><p className="mt-1 text-sm text-ink/55">Latest conversion events in this workspace.</p></div><span className="text-xs text-ink/45">{workspace.jobs.length} records</span></div></CardHeader><CardContent className="p-0">{workspace.jobs.length ? <div className="divide-y divide-line">{workspace.jobs.slice(0, 8).map((job) => <div key={job.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_7rem_9rem] sm:items-center"><div className="min-w-0"><p className="truncate font-medium">{job.fileName}</p><p className="mt-1 text-xs text-ink/45">{new Date(job.createdAt).toLocaleString()} · {job.targetRatio}</p></div><span className={`text-sm font-medium capitalize ${statusTone[job.status] || "text-ink/55"}`}>{job.status}</span><span className="text-sm text-ink/55">{job.progress}% processed</span></div>)}</div> : <p className="px-5 py-12 text-center text-sm text-ink/55">No conversion activity yet.</p>}</CardContent></Card>
      <div className="space-y-4">
        <Card><CardHeader><h2 className="font-semibold">Service health</h2></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between gap-3"><span className="text-sm text-ink/60">Browser processor</span><span className="flex items-center gap-2 text-sm font-medium text-mivim-600"><CheckCircle2 className="h-4 w-4" />Ready</span></div><div className="flex items-center justify-between gap-3"><span className="text-sm text-ink/60">Local video storage</span><span className="flex items-center gap-2 text-sm font-medium text-mivim-600"><CheckCircle2 className="h-4 w-4" />Ready</span></div><div className="flex items-center justify-between gap-3"><span className="text-sm text-ink/60">Paystack</span>{paystackReady === null ? <LoaderCircle className="h-4 w-4 animate-spin text-ink/40" /> : <span className={`flex items-center gap-2 text-sm font-medium ${paystackReady ? "text-mivim-600" : "text-coral"}`}>{paystackReady ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{paystackReady ? "Configured" : "Needs setup"}</span>}</div></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Attention required</h2></CardHeader><CardContent>{report.failed ? <div className="flex gap-3 text-sm"><AlertTriangle className="h-5 w-5 shrink-0 text-coral" /><p><span className="font-medium">{report.failed} failed {report.failed === 1 ? "conversion" : "conversions"}</span><span className="mt-1 block text-ink/55">Open History to retry or delete failed jobs.</span></p></div> : <div className="flex gap-3 text-sm"><CheckCircle2 className="h-5 w-5 shrink-0 text-mivim-600" /><p><span className="font-medium">No failed conversions</span><span className="mt-1 block text-ink/55">The workspace has no processing errors.</span></p></div>}</CardContent></Card>
      </div>
    </div>
  </div>;
}
