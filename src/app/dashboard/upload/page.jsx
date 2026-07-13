import { UploadDropzone } from "@/components/video/upload-dropzone";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Upload</h1>
        <p className="mt-1 text-ink/60">Validate video files, choose an output ratio, and queue conversion.</p>
      </div>
      <UploadDropzone />
    </div>
  );
}
