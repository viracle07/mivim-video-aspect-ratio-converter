import { JobActions } from "@/components/video/job-actions";

const statusClass = {
  completed: "bg-mivim-600 text-white",
  processing: "bg-amber/25 text-ink",
  queued: "bg-mist text-ink/70",
  failed: "bg-coral text-white"
};

export function JobTable({ jobs }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="grid grid-cols-[1.4fr_0.6fr_0.8fr_0.8fr_0.8fr] border-b border-line bg-mist px-4 py-3 text-sm font-medium text-ink/65 max-md:hidden">
        <span>File</span>
        <span>Ratio</span>
        <span>Status</span>
        <span>Progress</span>
        <span>Action</span>
      </div>
      {jobs.map((job) => (
        <div key={job.id} className="grid gap-3 border-b border-line px-4 py-4 last:border-0 md:grid-cols-[1.4fr_0.6fr_0.8fr_0.8fr_0.8fr] md:items-center">
          <div>
            <p className="font-medium">{job.fileName}</p>
            <p className="text-sm text-ink/55">{new Date(job.createdAt).toLocaleString()} · {job.size}</p>
            {(job.resolution || job.durationLabel) && <p className="mt-1 text-xs text-ink/45">{[job.resolution, job.durationLabel, job.quality || "720p", job.frameRate && job.frameRate !== "original" ? `${job.frameRate} fps` : null].filter(Boolean).join(" · ")}</p>}
          </div>
          <span className="text-sm">{job.targetRatio}</span>
          <span className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${statusClass[job.status]}`}>{job.status}</span>
          <div>
            <div className="h-2 rounded bg-mist">
              <div className="h-2 rounded bg-mivim-600" style={{ width: `${job.progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink/55">{job.progress}%</p>
          </div>
          <JobActions job={job} />
        </div>
      ))}
    </div>
  );
}
