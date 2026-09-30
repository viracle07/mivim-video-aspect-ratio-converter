import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import { PwaProvider } from "@/components/pwa/pwa-provider";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Mivim Video Resizer | Aspect Ratio Converter",
    template: "%s | Mivim Video Resizer"
  },
  description: "Resize videos online for 9:16, 1:1, 16:9, and 4:5 formats, convert video frame rates, preview results, and download polished MP4 files with Mivim.",
  applicationName: "Mivim Video Resizer",
  keywords: [
    "video resizer",
    "aspect ratio converter",
    "video aspect ratio converter",
    "resize video online",
    "video frame rate converter",
    "change video FPS",
    "social media video resizer",
    "portrait video converter",
    "landscape video converter",
    "9:16 video converter",
    "square video converter",
    "MP4 video resizer"
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Mivim Video Resizer",
    title: "Mivim Video Resizer and Aspect Ratio Converter",
    description: "Resize videos for social media aspect ratios and convert frame rates from one focused online workspace.",
    images: [{ url: "/images/mivim-format-workspace.png", alt: "Mivim video resizing workspace showing multiple aspect ratios" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Mivim Video Resizer",
    description: "Resize video aspect ratios and convert frame rates online.",
    images: ["/images/mivim-format-workspace.png"]
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mivim"
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/mivim-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/mivim-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icons/mivim-192.png"
  }
};

export const viewport = {
  themeColor: "#0d9488"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=localStorage.getItem('mivim-theme')||'system';var d=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=d;document.documentElement.dataset.themePreference=p}catch(e){}})()` }} /></head>
      <body><PwaProvider /><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
