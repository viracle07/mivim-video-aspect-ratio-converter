import { JobTable } from "@/components/video/job-table";
import { conversionJobs } from "@/lib/mock-data";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">History</h1>
        <p className="mt-1 text-ink/60">Searchable conversion records with previews, metadata, and downloads.</p>
      </div>
      <JobTable jobs={conversionJobs} />
    </div>
  );
}
