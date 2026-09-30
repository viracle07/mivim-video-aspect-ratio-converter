"use client";

import { useEffect } from "react";

export function PwaProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    function capturePrompt(event) {
      event.preventDefault();
      window.__mivimInstallPrompt = event;
      window.dispatchEvent(new Event("mivim-install-ready"));
    }

    function markInstalled() {
      window.__mivimInstallPrompt = null;
      window.dispatchEvent(new Event("mivim-installed"));
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  return null;
}
