"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }) {
  useEffect(() => { fetch("/api/errors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: error?.message || "Unknown client error", digest: error?.digest || "", path: window.location.pathname }) }).catch(() => {}); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-mist px-5 text-center"><div className="max-w-md"><div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-coral/10 text-coral"><AlertTriangle className="h-6 w-6" /></div><h1 className="mt-5 text-2xl font-semibold">MiVim hit an unexpected error</h1><p className="mt-2 text-ink/60">Your stored videos and account data are unchanged. Retry the page to continue.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></main>;
}
