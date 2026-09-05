"use client";

import { BellRing, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AccountControls() {
  async function enableBrowserNotifications() {
    if (!("Notification" in window)) return window.alert("This browser does not support desktop notifications.");
    const permission = await Notification.requestPermission();
    if (permission === "granted") new Notification("MiVim notifications enabled", { body: "Important account alerts can now appear on this device." });
  }
  async function deleteAccount() {
    const confirmation = window.prompt("This permanently deletes your account and MiVim records. Type DELETE to continue.");
    if (confirmation !== "DELETE") return;
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
    const result = await response.json();
    if (!response.ok) return window.alert(result.error || "Account could not be deleted.");
    localStorage.clear(); window.location.assign("/");
  }
  return <Card><CardHeader><h2 className="font-semibold">Data and notifications</h2><p className="mt-1 text-sm text-ink/55">Control alerts and your stored account records.</p></CardHeader><CardContent className="flex flex-wrap gap-3"><Button variant="secondary" onClick={enableBrowserNotifications}><BellRing className="h-4 w-4" />Enable browser alerts</Button><Button asChild variant="secondary" href="/api/account/export"><Download className="h-4 w-4" />Export account data</Button><Button variant="danger" onClick={deleteAccount}><Trash2 className="h-4 w-4" />Delete account</Button></CardContent></Card>;
}
