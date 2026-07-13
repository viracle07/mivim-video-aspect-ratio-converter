import Link from "next/link";
import { ArrowRight, Film, ShieldCheck, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const formats = ["9:16 Reels", "1:1 Square", "16:9 YouTube", "4:5 Feed"];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_0.95fr] lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm text-ink/70">
            <Film className="h-4 w-4 text-mivim-600" />
            Platform-ready video resizing
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-ink sm:text-6xl">
            MiVim Video Aspect Ratio Converter
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/70">
            Upload once, convert into every social format, preview the output, and keep a searchable conversion history.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {formats.map((format) => (
              <span key={format} className="rounded-full border border-line bg-white px-3 py-1 text-sm text-ink/70">
                {format}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="aspect-video rounded-md bg-[linear-gradient(135deg,#0c3b3a,#14b8a6_55%,#f9735b)] p-4 text-white">
            <div className="flex h-full flex-col justify-between rounded border border-white/25 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">mivim-edit-042.mp4</span>
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs">Processing</span>
              </div>
              <div>
                <div className="mb-3 h-2 rounded bg-white/25">
                  <div className="h-2 w-2/3 rounded bg-white" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span className="rounded bg-white/15 p-2">Crop smart</span>
                  <span className="rounded bg-white/15 p-2">Keep subject</span>
                  <span className="rounded bg-white/15 p-2">Export HD</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-line p-4">
              <WandSparkles className="mb-3 h-5 w-5 text-coral" />
              <p className="font-medium">FFmpeg-ready pipeline</p>
              <p className="mt-1 text-sm text-ink/60">Queue conversions through Cloud Run or any worker endpoint.</p>
            </div>
            <div className="rounded-md border border-line p-4">
              <ShieldCheck className="mb-3 h-5 w-5 text-mivim-600" />
              <p className="font-medium">Secure SaaS shell</p>
              <p className="mt-1 text-sm text-ink/60">Protected routes, billing status, CSP, and validation built in.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
