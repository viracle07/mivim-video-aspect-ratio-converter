"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileVideo, LoaderCircle, Play, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/workspace-context";
import { saveSourceVideo } from "@/lib/video-storage";

const acceptedTypes = ["video/mp4", "video/quicktime", "video/webm"];
const maxBytes = 500 * 1024 * 1024;
const ratios = ["9:16", "1:1", "16:9", "4:5"];

function formatDuration(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

export function UploadDropzone() {
  const router = useRouter();
  const { addJob } = useWorkspace();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [ratio, setRatio] = useState("9:16");
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  const fileSize = useMemo(() => file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "", [file]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null); setPreviewUrl(""); setMetadata(null); setProgress(0); setState("idle"); setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectFile(nextFile) {
    setMessage("");
    if (!nextFile) return;
    if (!acceptedTypes.includes(nextFile.type)) return setMessage("Use an MP4, MOV, or WEBM video file.");
    if (nextFile.size > maxBytes) return setMessage("Choose a video smaller than 500 MB.");
    if (nextFile.size === 0) return setMessage("This video file is empty.");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile); setPreviewUrl(URL.createObjectURL(nextFile)); setMetadata(null); setProgress(0); setState("inspecting");
  }

  function videoReady(event) {
    const video = event.currentTarget;
    if (!video.duration || !video.videoWidth || !video.videoHeight) {
      setMessage("MiVim could not read this video. Try a different file."); setState("idle"); return;
    }
    setMetadata({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
    setState("ready");
  }

  async function startUpload() {
    if (!file || !metadata || state === "uploading") return;
    setState("uploading"); setMessage(""); setProgress(12);
    try {
      const response = await fetch("/api/convert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, ratio, sizeBytes: file.size, ...metadata }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The upload could not be started.");
      setProgress(48);
      await saveSourceVideo(result.job.id, file);
      setProgress(88);
      addJob({ ...result.job, size: fileSize, durationLabel: formatDuration(metadata.duration), resolution: `${metadata.width} x ${metadata.height}` });
      setProgress(100); setState("complete"); setMessage("Video uploaded. Your conversion job is ready.");
    } catch (error) {
      setProgress(0); setState("ready"); setMessage(error.message || "The upload failed. Please try again.");
    }
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5">
      {!file && <label className="grid min-h-64 cursor-pointer place-items-center rounded-md border-2 border-dashed border-line bg-mist/70 px-5 text-center transition hover:border-mivim-500" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }}><input ref={inputRef} className="sr-only" type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(event) => selectFile(event.target.files?.[0])} /><span><UploadCloud className="mx-auto mb-3 h-10 w-10 text-mivim-600" /><span className="block text-lg font-medium">Drop a video or browse</span><span className="mt-1 block text-sm text-ink/55">MP4, MOV, WEBM up to 500 MB</span></span></label>}
      {file && <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <div className="overflow-hidden rounded-md bg-ink"><video className="aspect-video w-full object-contain" src={previewUrl} controls preload="metadata" onLoadedMetadata={videoReady} /></div>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><FileVideo className="mt-0.5 h-5 w-5 shrink-0 text-coral" /><div className="min-w-0"><p className="truncate font-medium">{file.name}</p><p className="mt-1 text-sm text-ink/55">{fileSize}{metadata ? ` · ${metadata.width} x ${metadata.height} · ${formatDuration(metadata.duration)}` : ""}</p></div></div><button type="button" aria-label="Remove video" title="Remove video" onClick={clearFile} disabled={state === "uploading"} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-ink/55 hover:bg-mist hover:text-coral disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div>
          <fieldset><legend className="text-sm font-medium">Output aspect ratio</legend><div className="mt-2 grid grid-cols-4 gap-2">{ratios.map((item) => <button key={item} type="button" onClick={() => setRatio(item)} disabled={state === "uploading" || state === "complete"} className={`h-10 rounded-md border text-sm font-medium transition ${ratio === item ? "border-mivim-600 bg-mivim-600 text-white" : "border-line bg-white hover:bg-mist"}`}>{item}</button>)}</div></fieldset>
          <div><div className="flex justify-between text-xs text-ink/55"><span>{state === "uploading" ? "Saving source video" : state === "complete" ? "Upload complete" : "Ready to upload"}</span><span>{progress}%</span></div><div className="mt-2 h-2 rounded bg-mist"><div className="h-2 rounded bg-mivim-600 transition-all" style={{ width: `${progress}%` }} /></div></div>
          {state === "complete" ? <Button className="w-full" onClick={() => router.push("/dashboard/history")}><CheckCircle2 className="h-4 w-4" />View conversion job</Button> : <Button className="w-full" onClick={startUpload} disabled={!metadata || state === "uploading"}>{state === "uploading" || state === "inspecting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{state === "uploading" ? "Uploading..." : state === "inspecting" ? "Inspecting video..." : "Create conversion job"}</Button>}
        </div>
      </div>}
      {message && <p className={`mt-4 rounded-md px-3 py-2 text-sm ${state === "complete" ? "bg-mivim-600/10 text-mivim-600" : "bg-amber/20 text-ink/70"}`}>{message}</p>}
    </div>
  );
}
