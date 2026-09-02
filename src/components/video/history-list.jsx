"use client";

import { useMemo, useState } from "react";
import { Search, UploadCloud } from "lucide-react";
import { JobTable } from "@/components/video/job-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/workspace-context";

const filters = ["all", "queued", "processing", "completed", "failed"];

export function HistoryList() {
  const { workspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const jobs = useMemo(() => {
    const filtered = (workspace?.jobs || []).filter((job) => {
      const matchesName = job.fileName.toLowerCase().includes(query.trim().toLowerCase());
      return matchesName && (status === "all" || job.status === status);
    });
    return filtered.sort((a, b) => {
      if (sort === "name") return a.fileName.localeCompare(b.fileName);
      const difference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === "oldest" ? -difference : difference;
    });
  }, [query, sort, status, workspace]);

  if (!workspace) return <div className="h-48 animate-pulse rounded-lg bg-white" />;
  const hasJobs = (workspace.jobs || []).length > 0;

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative w-full max-w-md"><Search className="absolute left-3 top-3.5 h-4 w-4 text-ink/40" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search video names" /></div>
      <div className="flex flex-wrap gap-2" aria-label="Filter conversion history">{filters.map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`h-9 rounded-md border px-3 text-sm font-medium capitalize transition ${status === item ? "border-mivim-600 bg-mivim-600 text-white" : "border-line bg-white hover:bg-mist"}`}>{item}</button>)}</div>
      <select aria-label="Sort conversion history" className="h-10 rounded-md border border-line bg-white px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">File name</option></select>
    </div>
    <p className="text-sm text-ink/55">{jobs.length} {jobs.length === 1 ? "conversion" : "conversions"}</p>
    {jobs.length ? <JobTable jobs={jobs} /> : <div className="rounded-lg border border-line bg-white px-5 py-12 text-center"><p className="font-medium">{hasJobs ? "No matching conversions" : "Your conversion library is empty"}</p><p className="mx-auto mt-2 max-w-md text-sm text-ink/55">{hasJobs ? "Try another search or status filter." : "Upload a video to create your first conversion job."}</p>{!hasJobs && <Button asChild href="/dashboard/upload" className="mt-5"><UploadCloud className="h-4 w-4" />Upload video</Button>}</div>}
  </div>;
}
