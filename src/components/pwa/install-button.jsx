"use client";

import { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";

export function InstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setInstalled(standalone);

    function capturePrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }

    function markInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={install}
        disabled={!installPrompt || installed}
        className="inline-flex h-12 items-center gap-2 rounded-md border border-white/35 px-5 font-semibold text-white transition hover:bg-white/10 disabled:cursor-default disabled:opacity-60"
      >
        {installed ? <Check className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        {installed ? "MiVim installed" : "Install MiVim app"}
      </button>
      <p className="max-w-sm text-sm text-white/65">
        {installPrompt ? "Install MiVim app here for quick access from your device." : installed ? "Open MiVim anytime from your apps." : "Install MiVim from your browser menu when the install option appears."}
      </p>
    </div>
  );
}
