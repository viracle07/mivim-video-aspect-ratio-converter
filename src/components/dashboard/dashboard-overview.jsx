"use client";

import { ArrowUpRight, Clock, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { JobTable } from "@/components/video/job-table";
import { useWorkspace } from "@/contexts/workspace-context";
import { formatStorage, getWorkspaceStats } from "@/lib/workspace";

export function DashboardOverview() {
  const { workspace } = useWorkspace();
  if (!workspace) return <div className="h-64 animate-pulse rounded-lg bg-white" />;

  const stats = getWorkspaceStats(workspace);
  const analytics = [
    { label: "Conversions", value: String(stats.total), delta: `${stats.completed} completed` },
    { label: "Storage used", value: formatStorage(stats.storageMb), delta: "Across uploaded videos" },
    { label: "Active jobs", value: String(stats.active), delta: stats.active ? "In the processing queue" : "Queue is clear" },
    { label: "Trial days left", value: String(stats.trialDays), delta: "Upgrade anytime" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-mivim-600">Welcome back, {workspace.profile.displayName || "Creator"}</p>
          <h1 className="mt-1 text-3xl font-semibold">Creator dashboard</h1>
          <p className="mt-1 text-ink/60">Your videos, usage, and account status in one place.</p>
        </div>
        <Button asChild href="/dashboard/upload"><UploadCloud className="h-4 w-4" />Upload video</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{analytics.map((item) => <StatCard key={item.label} {...item} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><h2 className="font-semibold">Recent conversions</h2><Button asChild variant="ghost" size="sm" href="/dashboard/history">View all <ArrowUpRight className="h-4 w-4" /></Button></CardHeader>
          <CardContent>{workspace.jobs.length ? <JobTable jobs={workspace.jobs.slice(0, 3)} /> : <div className="py-10 text-center"><p className="font-medium">No conversions yet</p><p className="mt-2 text-sm text-ink/55">Upload your first video to start building your library.</p><Button asChild href="/dashboard/upload" variant="secondary" className="mt-4"><UploadCloud className="h-4 w-4" />Upload video</Button></div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Workspace status</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-mist p-4"><Clock className="mb-3 h-5 w-5 text-mivim-600" /><p className="font-medium">Ready for new uploads</p><p className="mt-1 text-sm text-ink/60">Your queue has {stats.active} active {stats.active === 1 ? "job" : "jobs"}.</p></div>
            <div className="border-t border-line pt-4"><div className="flex justify-between text-sm"><span className="text-ink/60">Current plan</span><span className="font-medium capitalize">{workspace.plan}</span></div><div className="mt-3 h-2 rounded bg-mist"><div className="h-2 rounded bg-mivim-600" style={{ width: `${Math.min(stats.total, 100)}%` }} /></div><p className="mt-2 text-xs text-ink/55">{stats.total} of 100 monthly conversions used</p></div>
            <Button asChild variant="secondary" className="w-full" href="/dashboard/billing">Manage plan</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
