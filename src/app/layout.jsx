import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import { PwaProvider } from "@/components/pwa/pwa-provider";

export const metadata = {
  title: "MiVim Video Aspect Ratio Converter",
  description: "Convert videos into platform-ready aspect ratios with secure uploads, previews, history, and billing.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MiVim"
  },
  icons: {
    icon: [
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
