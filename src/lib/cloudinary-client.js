"use client";

import { getSourceVideo, saveConvertedVideo } from "@/lib/video-storage";

const smartSizes = {
  "720p": { "9:16": [720, 1280], "1:1": [720, 720], "16:9": [1280, 720], "4:5": [720, 900] },
  "1080p": { "9:16": [1080, 1920], "1:1": [1080, 1080], "16:9": [1920, 1080], "4:5": [1080, 1350] }
};

async function getUploadSignature(jobId, kind) {
  const response = await fetch("/api/cloudinary/signature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId, kind }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Cloud processing is unavailable.");
  return result;
}

async function uploadVideo(jobId, file, kind) {
  const signed = await getUploadSignature(jobId, kind);
  const body = new FormData();
  body.set("file", file, `${jobId}.mp4`); body.set("api_key", signed.apiKey); body.set("timestamp", String(signed.timestamp)); body.set("signature", signed.signature); body.set("folder", signed.folder); body.set("public_id", signed.publicId);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/video/upload`, { method: "POST", body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Cloud upload failed.");
  return result;
}

export async function uploadConvertedVideo(jobId, blob) {
  const result = await uploadVideo(jobId, blob, "output");
  return { url: result.secure_url, publicId: result.public_id, bytes: result.bytes };
}

export async function convertSmartVideo(job, onProgress) {
  const source = await getSourceVideo(job.id);
  if (!source) throw new Error("The source video is no longer stored in this browser.");
  onProgress(12);
  const uploaded = await uploadVideo(job.id, source, "source");
  onProgress(42);
  const quality = smartSizes[job.quality] ? job.quality : "720p";
  const [width, height] = smartSizes[quality][job.targetRatio] || smartSizes[quality]["9:16"];
  const frameRate = job.frameRate && job.frameRate !== "original" ? `,fps_${job.frameRate}` : "";
  const transformation = `c_fill,g_auto,h_${height},w_${width}${frameRate}/f_mp4,q_auto:good`;
  const transformedUrl = uploaded.secure_url.replace("/video/upload/", `/video/upload/${transformation}/`).replace(/\.[^.]+$/, ".mp4");
  let response;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    response = await fetch(transformedUrl, { cache: "no-store" });
    if (response.ok) break;
    if (![420, 423].includes(response.status)) throw new Error("Smart reframing could not process this video.");
    onProgress(Math.min(90, 45 + attempt * 2));
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  if (!response?.ok) throw new Error("Smart reframing is still processing. Retry in a few minutes.");
  const blob = await response.blob();
  await saveConvertedVideo(job.id, blob);
  onProgress(98);
  return { blob, outputSize: blob.size, sourcePublicId: uploaded.public_id, outputName: `${job.fileName.replace(/\.[^.]+$/, "")}-${job.targetRatio.replace(":", "x")}-${quality}-smart.mp4` };
}

export async function deleteCloudVideo(publicId) {
  const response = await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Cloud video could not be deleted.");
}
