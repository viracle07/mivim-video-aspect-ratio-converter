import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { getSourceVideo, saveConvertedVideo } from "@/lib/video-storage";

const outputSizes = {
  "720p": { "9:16": [720, 1280], "1:1": [720, 720], "16:9": [1280, 720], "4:5": [720, 900] },
  "1080p": { "9:16": [1080, 1920], "1:1": [1080, 1080], "16:9": [1920, 1080], "4:5": [1080, 1350] }
};

let ffmpegPromise;
let latestFFmpegError = "";

export function cancelVideoConversion() {
  if (!ffmpegPromise) return;
  ffmpegPromise.then((ffmpeg) => ffmpeg.terminate()).catch(() => {});
  ffmpegPromise = null;
}

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", ({ message }) => {
        if (/error|failed|invalid|unsupported/i.test(message)) latestFFmpegError = message;
      });
      const origin = window.location.origin;
      await ffmpeg.load({
        coreURL: `${origin}/api/ffmpeg-core/ffmpeg-core-umd-v1.js`,
        wasmURL: `${origin}/api/ffmpeg-core/ffmpeg-core-umd-v1.wasm`
      });
      return ffmpeg;
    })().catch((error) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

export async function convertVideo(job, onProgress) {
  const source = await getSourceVideo(job.id);
  if (!source) throw new Error("The source video is no longer stored in this browser.");

  let ffmpeg;
  try {
    ffmpeg = await getFFmpeg();
  } catch (error) {
    throw new Error(`The video engine could not start. ${error instanceof Error ? error.message : String(error)}`);
  }
  const inputExtension = job.fileName.split(".").pop()?.toLowerCase() || "mp4";
  const inputName = `input-${job.id}.${inputExtension}`;
  const outputName = `mivim-${job.id}.mp4`;
  const quality = outputSizes[job.quality] ? job.quality : "720p";
  const [width, height] = outputSizes[quality][job.targetRatio] || outputSizes[quality]["9:16"];
  const backgroundColor = /^#[0-9a-fA-F]{6}$/.test(job.backgroundColor || "") ? job.backgroundColor.slice(1) : "101418";
  const filter = job.fitMode === "solid"
    ? `color=c=0x${backgroundColor}:s=${width}x${height}[background];[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease[foreground];[background][foreground]overlay=(W-w)/2:(H-h)/2:shortest=1,setsar=1[video]`
    : `[0:v]split=2[backgroundSource][foregroundSource];[backgroundSource]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=30:20[background];[foregroundSource]scale=${width}:${height}:force_original_aspect_ratio=decrease[foreground];[background][foreground]overlay=(W-w)/2:(H-h)/2:shortest=1,setsar=1[video]`;
  const frameRateArgs = job.frameRate && job.frameRate !== "original" ? ["-r", job.frameRate] : [];
  let lastReportedProgress = 0;
  let lastReportedAt = 0;
  const progressHandler = ({ progress }) => {
    const nextProgress = Math.max(1, Math.min(99, Math.round(progress * 100)));
    const now = Date.now();
    if (nextProgress >= lastReportedProgress + 5 || now - lastReportedAt >= 1000) {
      lastReportedProgress = nextProgress;
      lastReportedAt = now;
      onProgress(nextProgress);
    }
  };

  ffmpeg.on("progress", progressHandler);
  try {
    await ffmpeg.writeFile(inputName, await fetchFile(source));
    const timeout = Math.min(30 * 60 * 1000, Math.max(2 * 60 * 1000, Math.ceil((job.duration || 30) * 6000)));
    const exitCode = await ffmpeg.exec([
      "-i", inputName,
      "-filter_complex", filter,
      "-map", "[video]", "-map", "0:a?",
      ...frameRateArgs,
      "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
      "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
      outputName
    ], timeout);
    if (exitCode !== 0) throw new Error(latestFFmpegError || "The conversion timed out. Try a shorter or lower-resolution video.");
    const output = await ffmpeg.readFile(outputName);
    const blob = new Blob([output.buffer], { type: "video/mp4" });
    await saveConvertedVideo(job.id, blob);
    return { blob, outputSize: blob.size, outputName: `${job.fileName.replace(/\.[^.]+$/, "")}-${job.targetRatio.replace(":", "x")}-${quality}.mp4` };
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
