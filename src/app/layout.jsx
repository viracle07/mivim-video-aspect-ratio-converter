import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";

export const metadata = {
  title: "MiVim Video Aspect Ratio Converter",
  description: "Convert videos into platform-ready aspect ratios with secure uploads, previews, history, and billing."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=localStorage.getItem('mivim-theme')||'system';var d=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=d;document.documentElement.dataset.themePreference=p}catch(e){}})()` }} /></head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
