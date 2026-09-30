"use client";

import { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";

export function InstallButton({ compact = false }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setInstalled(standalone);

    function refreshPrompt() {
      setInstallPrompt(window.__mivimInstallPrompt || null);
    }

    function markInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    refreshPrompt();
    window.addEventListener("mivim-install-ready", refreshPrompt);
    window.addEventListener("appinstalled", markInstalled);
    window.addEventListener("mivim-installed", markInstalled);
    return () => {
      window.removeEventListener("mivim-install-ready", refreshPrompt);
      window.removeEventListener("appinstalled", markInstalled);
      window.removeEventListener("mivim-installed", markInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      window.__mivimInstallPrompt = null;
      setInstallPrompt(null);
    }
  }

  if (compact) return (
    <button
      type="button"
      onClick={install}
      disabled={!installPrompt || installed}
      aria-label={installed ? "MiVim is installed" : "Install MiVim app"}
      title={installed ? "MiVim is installed" : installPrompt ? "Install MiVim app" : "Install option will appear when available"}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-surface px-2.5 text-sm font-medium text-ink transition hover:bg-mist disabled:cursor-default disabled:opacity-55 xl:px-3"
    >
      {installed ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
      <span className="hidden xl:inline">{installed ? "Installed" : "Install app"}</span>
    </button>
  );

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
