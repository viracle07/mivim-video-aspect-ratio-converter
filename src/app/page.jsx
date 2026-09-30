import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Film, LockKeyhole, MonitorPlay, Scissors } from "lucide-react";
import { InstallButton } from "@/components/pwa/install-button";

export const metadata = {
  alternates: { canonical: "/" }
};

const formats = [
  { ratio: "9:16", label: "Stories & Reels" },
  { ratio: "1:1", label: "Square posts" },
  { ratio: "16:9", label: "YouTube & web" },
  { ratio: "4:5", label: "Portrait feeds" }
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Mivim Video Resizer",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: "An online video resizer and aspect ratio converter that also converts video frame rates.",
    featureList: ["Resize video aspect ratios", "Convert video frame rates", "Create 9:16, 1:1, 16:9, and 4:5 videos", "Preview and download MP4 video files"],
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What does Mivim Video Resizer do?", acceptedAnswer: { "@type": "Answer", text: "Mivim resizes videos into popular aspect ratios and converts a video from one frame rate to another for different platforms and playback needs." } },
      { "@type": "Question", name: "Which video aspect ratios can Mivim create?", acceptedAnswer: { "@type": "Answer", text: "Mivim supports vertical 9:16, square 1:1, landscape 16:9, and portrait 4:5 video formats." } },
      { "@type": "Question", name: "Can Mivim change video frame rate?", acceptedAnswer: { "@type": "Answer", text: "Yes. Mivim can keep the original frame rate or convert a video to 24, 30, or 60 frames per second." } }
    ]
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/20 bg-night/75 text-white backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold" aria-label="Mivim home">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-mivim-500 text-night"><Film className="h-5 w-5" /></span>
            <span className="text-lg">Mivim Video Resizer</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Account">
            <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10" href="/login">Log in</Link>
            <Link className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-night hover:bg-mist" href="/signup">Start free</Link>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[82vh] items-end overflow-hidden bg-night">
        <Image
          src="/images/mivim-format-workspace.png"
          alt="A creator preparing one video in four social media aspect ratios"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-night/35" />
        <div className="relative z-10 w-full border-t border-white/20 bg-night/90">
          <div className="mx-auto max-w-7xl px-5 py-8 text-white sm:px-8 sm:py-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase text-mivim-500">One video. Every format.</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">Mivim Video Resizer</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">Resize videos into polished vertical, square, landscape, and portrait formats, then choose the frame rate you need.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="inline-flex h-12 items-center gap-2 rounded-md bg-mivim-500 px-5 font-semibold text-night hover:bg-white" href="/signup">Start converting <ArrowRight className="h-5 w-5" /></Link>
                <Link className="inline-flex h-12 items-center rounded-md border border-white/35 px-5 font-semibold hover:bg-white/10" href="/login">Log in</Link>
                <InstallButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface py-12 sm:py-14" aria-labelledby="about-mivim">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:px-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-start">
          <p className="text-sm font-semibold text-mivim-600">About Mivim</p>
          <div className="max-w-3xl">
            <h2 id="about-mivim" className="text-2xl font-semibold sm:text-3xl">Resize the frame. Change the frame rate.</h2>
            <p className="mt-3 leading-7 text-ink/65">Mivim Video Resizer converts a video from one aspect ratio or frame rate to another, helping you prepare the same footage for social feeds, stories, websites, and widescreen playback.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-mist py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-mivim-600">Ready for every channel</p>
              <h2 className="mt-2 text-3xl font-semibold">Create once. Publish everywhere.</h2>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-4">
              {formats.map((format) => (
                <div key={format.ratio} className="bg-surface px-4 py-5">
                  <p className="text-2xl font-semibold">{format.ratio}</p>
                  <p className="mt-1 text-sm text-ink/55">{format.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-coral">Creator-friendly workflow</p>
            <h2 className="mt-2 text-3xl font-semibold">From upload to download in one focused workspace.</h2>
            <ul className="mt-6 space-y-4 text-ink/70">
              {["Preview the framing before you convert", "Download finished MP4 files immediately", "Return to completed conversions from your history"].map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-mivim-600" />{item}</li>)}
            </ul>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div><MonitorPlay className="h-7 w-7 text-mivim-600" /><h3 className="mt-3 font-semibold">Preview</h3><p className="mt-2 text-sm leading-6 text-ink/60">Inspect your source video and choose the right framing.</p></div>
            <div><Scissors className="h-7 w-7 text-coral" /><h3 className="mt-3 font-semibold">Convert</h3><p className="mt-2 text-sm leading-6 text-ink/60">Process common social formats with browser-based FFmpeg.</p></div>
            <div><LockKeyhole className="h-7 w-7 text-amber" /><h3 className="mt-3 font-semibold">Keep control</h3><p className="mt-2 text-sm leading-6 text-ink/60">Video processing stays on your device during conversion.</p></div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-mist py-14 sm:py-16" aria-labelledby="video-resizer-questions">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-sm font-semibold text-mivim-600">Common questions</p>
          <h2 id="video-resizer-questions" className="mt-2 text-3xl font-semibold">Video resizing, answered.</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div><h3 className="font-semibold">What does Mivim do?</h3><p className="mt-2 text-sm leading-6 text-ink/65">Mivim resizes videos into popular aspect ratios and converts a video from one frame rate to another for different platforms and playback needs.</p></div>
            <div><h3 className="font-semibold">Which aspect ratios are supported?</h3><p className="mt-2 text-sm leading-6 text-ink/65">Create vertical 9:16, square 1:1, landscape 16:9, and portrait 4:5 video formats.</p></div>
            <div><h3 className="font-semibold">Can Mivim change video frame rate?</h3><p className="mt-2 text-sm leading-6 text-ink/65">Yes. Keep the original frame rate or convert your video to 24, 30, or 60 frames per second.</p></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-night py-7 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>Mivim Video Resizer</p><div className="flex gap-4"><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link><a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com"}`} className="hover:text-white">Support</a></div></div>
      </footer>
    </main>
  );
}
