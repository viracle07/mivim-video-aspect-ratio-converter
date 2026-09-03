import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { getSourceVideo, saveConvertedVideo } from "@/lib/video-storage";

const outputSizes = {
  "9:16": [720, 1280],
  "1:1": [1080, 1080],
  "16:9": [1280, 720],
  "4:5": [864, 1080]
};

let ffmpegPromise;
let latestFFmpegError = "";

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", ({ message }) => {
        if (/error|failed|invalid|unsupported/i.test(message)) latestFFmpegError = message;
      });
      await ffmpeg.load({
        coreURL: "/api/ffmpeg-core/ffmpeg-core.js",
        wasmURL: "/api/ffmpeg-core/ffmpeg-core.wasm"
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
  const [width, height] = outputSizes[job.targetRatio] || outputSizes["9:16"];
  const progressHandler = ({ progress }) => onProgress(Math.max(1, Math.min(99, Math.round(progress * 100))));

  ffmpeg.on("progress", progressHandler);
  try {
    await ffmpeg.writeFile(inputName, await fetchFile(source));
    const exitCode = await ffmpeg.exec([
      "-i", inputName,
      "-map", "0:v:0", "-map", "0:a?",
      "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`,
      "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
      "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
      outputName
    ]);
    if (exitCode !== 0) throw new Error(latestFFmpegError || "FFmpeg could not convert this video format.");
    const output = await ffmpeg.readFile(outputName);
    const blob = new Blob([output.buffer], { type: "video/mp4" });
    await saveConvertedVideo(job.id, blob);
    return { blob, outputSize: blob.size, outputName: `${job.fileName.replace(/\.[^.]+$/, "")}-${job.targetRatio.replace(":", "x")}.mp4` };
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
