import "./globals.css";

export const metadata = {
  title: "MiVim Video Aspect Ratio Converter",
  description: "Convert videos into platform-ready aspect ratios with secure uploads, previews, history, and billing."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
