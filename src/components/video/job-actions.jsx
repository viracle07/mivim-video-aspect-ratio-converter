"use client";

import { useEffect, useState } from "react";
import { Download, Eye, LoaderCircle, Play, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/workspace-context";
import { cancelVideoConversion, convertVideo } from "@/lib/video-converter";
import { deleteJobVideos, getConvertedVideo } from "@/lib/video-storage";
import { deleteCloudVideo, uploadConvertedVideo } from "@/lib/cloudinary-client";

export function JobActions({ job }) {
  const { removeJob, updateJob } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function processVideo() {
    setBusy(true); setError("");
    updateJob(job.id, { status: "processing", progress: 1, error: "" });
    try {
      const result = await convertVideo(job, (progress) => updateJob(job.id, { status: "processing", progress }));
      let cloud = null;
      let cloudError = "";
      try {
        cloud = await uploadConvertedVideo(job.id, result.blob);
      } catch (uploadError) {
        cloudError = uploadError.message || "Cloud backup was unavailable.";
      }
      updateJob(job.id, { status: "completed", progress: 100, outputStored: true, outputName: result.outputName, outputBytes: result.outputSize, cloudUrl: cloud?.url || "", cloudPublicId: cloud?.publicId || "", cloudStatus: cloud ? "stored" : "local", cloudError, completedAt: new Date().toISOString() });
      if (cloudError) setError(`Conversion completed and is stored on this device. Cloud backup: ${cloudError}`);
    } catch (conversionError) {
      const message = conversionError.message || "Conversion failed.";
      setError(message);
      updateJob(job.id, { status: "failed", progress: 0, error: message });
    } finally {
      setBusy(false);
    }
  }

  async function loadOutput(download) {
    const blob = await getConvertedVideo(job.id);
    if (!blob && !job.cloudUrl) { setError("The converted video is no longer available on this device or in cloud storage."); return; }
    const url = blob ? URL.createObjectURL(blob) : job.cloudUrl;
    if (download) {
      const link = document.createElement("a");
      link.href = url; link.download = job.outputName || "mivim-video.mp4"; if (!blob) link.target = "_blank"; link.click();
      if (blob) setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      setPreviewUrl(url);
    }
  }

  function cancelConversion() {
    cancelVideoConversion();
    setBusy(false);
    setError("Conversion cancelled. You can retry when ready.");
    updateJob(job.id, { status: "failed", progress: 0, error: "Conversion cancelled. Select Retry to start again." });
  }

  async function deleteJob() {
    if (!window.confirm(`Delete ${job.fileName} and its stored video files?`)) return;
    setBusy(true);
    try {
      if (job.cloudPublicId) await deleteCloudVideo(job.cloudPublicId);
      await deleteJobVideos(job.id);
      removeJob(job.id);
    } catch {
      setError("This conversion could not be deleted. Please try again.");
      setBusy(false);
    }
  }

  const deleteButton = <button type="button" onClick={deleteJob} disabled={busy || job.status === "processing"} className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line text-ink/50 transition hover:border-coral hover:text-coral disabled:opacity-40" title="Delete conversion" aria-label={`Delete ${job.fileName}`}><Trash2 className="h-4 w-4" /></button>;

  if (job.status === "completed" && job.outputStored) {
    return <><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => loadOutput(false)} title="Preview video"><Eye className="h-4 w-4" /></Button><Button variant="secondary" size="sm" onClick={() => loadOutput(true)} title="Download video"><Download className="h-4 w-4" />Download</Button>{deleteButton}</div>{previewUrl && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/85 p-5" onClick={() => setPreviewUrl("")}><div className="w-full max-w-4xl" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex justify-end"><button className="grid h-10 w-10 place-items-center rounded-md bg-white text-ink" onClick={() => setPreviewUrl("")} aria-label="Close preview"><X className="h-5 w-5" /></button></div><video className="max-h-[78vh] w-full bg-black" src={previewUrl} controls autoPlay /></div></div>}</>;
  }

  if (!job.sourceStorage) return <div className="flex items-center gap-2"><span className="text-xs text-ink/45">Demo job</span>{deleteButton}</div>;
  return <div><div className="flex gap-2">{busy ? <Button variant="danger" size="sm" onClick={cancelConversion}>Cancel</Button> : <Button variant="secondary" size="sm" onClick={processVideo} disabled={job.status === "processing"}>{job.status === "processing" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{job.status === "failed" ? "Retry" : job.status === "processing" ? "Converting" : "Convert"}</Button>}{deleteButton}</div>{(error || job.error) && <p className="mt-2 max-w-44 text-xs text-coral">{error || job.error}</p>}</div>;
}
