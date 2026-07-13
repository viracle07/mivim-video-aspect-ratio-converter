"use client";

import { useMemo, useState } from "react";
import { FileVideo, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

const acceptedTypes = ["video/mp4", "video/quicktime", "video/webm"];
const maxBytes = 500 * 1024 * 1024;

export function UploadDropzone() {
  const [file, setFile] = useState(null);
  const [ratio, setRatio] = useState("9:16");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const fileSize = useMemo(() => (file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ""), [file]);

  function selectFile(nextFile) {
    setMessage("");
    if (!nextFile) return;
    if (!acceptedTypes.includes(nextFile.type)) {
      setMessage("Use MP4, MOV, or WEBM video files.");
      return;
    }
    if (nextFile.size > maxBytes) {
      setMessage("Files must be 500 MB or smaller.");
      return;
    }
    setFile(nextFile);
  }

  async function startUpload() {
    if (!file) return;
    setProgress(8);
    for (const value of [22, 46, 71, 89, 100]) {
      await new Promise((resolve) => setTimeout(resolve, 260));
      setProgress(value);
    }
    await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, ratio })
    });
    setMessage("Upload accepted. Conversion job queued.");
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <label
        className="grid min-h-64 cursor-pointer place-items-center rounded-md border-2 border-dashed border-line bg-mist/70 px-5 text-center transition hover:border-mivim-500"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          selectFile(event.dataTransfer.files?.[0]);
        }}
      >
        <input className="sr-only" type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(event) => selectFile(event.target.files?.[0])} />
        <span>
          <UploadCloud className="mx-auto mb-3 h-10 w-10 text-mivim-600" />
          <span className="block text-lg font-medium">Drop a video or browse</span>
          <span className="mt-1 block text-sm text-ink/55">MP4, MOV, WEBM up to 500 MB</span>
        </span>
      </label>

      {file && (
        <div className="mt-5 rounded-md border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileVideo className="h-5 w-5 text-coral" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-ink/55">{fileSize}</p>
              </div>
            </div>
            <select className="h-10 rounded-md border border-line bg-white px-3" value={ratio} onChange={(event) => setRatio(event.target.value)}>
              <option>9:16</option>
              <option>1:1</option>
              <option>16:9</option>
              <option>4:5</option>
            </select>
          </div>
          <div className="mt-4 h-2 rounded bg-mist">
            <div className="h-2 rounded bg-mivim-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <Button className="mt-4" onClick={startUpload}>Start conversion</Button>
        </div>
      )}

      {message && <p className="mt-4 rounded-md bg-amber/20 px-3 py-2 text-sm text-ink/70">{message}</p>}
    </div>
  );
}
