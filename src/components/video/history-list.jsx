"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { JobTable } from "@/components/video/job-table";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/contexts/workspace-context";

export function HistoryList() {
  const { workspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const jobs = useMemo(() => (workspace?.jobs || []).filter((job) => job.fileName.toLowerCase().includes(query.toLowerCase())), [query, workspace]);
  if (!workspace) return <div className="h-48 animate-pulse rounded-lg bg-white" />;
  return <div className="space-y-4"><div className="relative max-w-md"><Search className="absolute left-3 top-3.5 h-4 w-4 text-ink/40" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search video names" /></div>{jobs.length ? <JobTable jobs={jobs} /> : <div className="rounded-lg border border-line bg-white px-5 py-12 text-center text-ink/55">No conversion jobs match your search.</div>}</div>;
}
