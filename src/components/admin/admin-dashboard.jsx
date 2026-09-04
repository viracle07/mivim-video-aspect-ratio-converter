"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDollarSign, FileVideo, LoaderCircle, RefreshCw, Search, ShieldBan, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/dashboard/stat-card";

const statusTone = { active: "bg-mivim-600/10 text-mivim-600", trial: "bg-mist text-ink/60", "non-renewing": "bg-amber/20 text-amber-700", attention: "bg-amber/20 text-amber-700", suspended: "bg-coral/10 text-coral", disabled: "bg-coral/10 text-coral" };

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => { setError(""); const response = await fetch("/api/admin/overview", { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Admin data could not be loaded."); setData(result); }, []);

  useEffect(() => { load().catch((loadError) => setError(loadError.message)); }, [load]);

  const users = useMemo(() => (data?.users || []).filter((user) => {
    const matchesQuery = `${user.displayName} ${user.email}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "paid" ? ["monthly", "yearly"].includes(user.plan) : user.status === filter);
    return matchesQuery && matchesFilter;
  }), [data, filter, query]);

  async function updateUser(user, action, plan) {
    const label = action === "grant-plan" ? `grant ${plan} access to` : `${action.replaceAll("-", " ")} for`;
    if (!window.confirm(`Confirm ${label} ${user.email || user.displayName}?`)) return;
    setBusy(`${user.uid}:${action}`); setError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.uid)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, plan }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "User could not be updated.");
      await load();
    } catch (actionError) { setError(actionError.message); }
    finally { setBusy(""); }
  }

  if (!data && !error) return <div className="grid h-64 place-items-center"><LoaderCircle className="h-6 w-6 animate-spin text-mivim-600" /></div>;
  const totals = data?.totals || { users: 0, paid: 0, conversions: 0, failed: 0 };
  const cards = [
    { label: "Registered users", value: String(totals.users), delta: "Firestore workspaces", icon: Users },
    { label: "Paid accounts", value: String(totals.paid), delta: "Currently entitled", icon: CircleDollarSign },
    { label: "Conversions", value: String(totals.conversions), delta: "Across all users", icon: FileVideo },
    { label: "Failed jobs", value: String(totals.failed), delta: totals.failed ? "Needs review" : "No failures", icon: AlertTriangle }
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Admin operations</h1><p className="mt-1 text-ink/60">Users, access, subscriptions, usage, and administrator activity.</p></div><Button variant="secondary" onClick={() => load().catch((loadError) => setError(loadError.message))}><RefreshCw className="h-4 w-4" />Refresh</Button></div>
    {error && <div className="rounded-md bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ icon: Icon, ...card }) => <StatCard key={card.label} {...card} icon={<Icon className="h-4 w-4" />} />)}</div>
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">User access</h2><p className="mt-1 text-sm text-ink/55">{users.length} matching accounts</p></div><div className="flex flex-wrap gap-2"><label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-ink/40" /><Input className="w-64 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" /></label><select className="h-10 rounded-md border border-line bg-white px-3 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All accounts</option><option value="paid">Paid</option><option value="trial">Free</option><option value="attention">Payment attention</option><option value="suspended">Suspended</option><option value="disabled">Disabled</option></select></div></div></CardHeader>
      <CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-y border-line bg-mist/70 text-ink/55"><tr><th className="px-5 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Access</th><th className="px-4 py-3 font-medium">Usage</th><th className="px-4 py-3 font-medium">Activity</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-line">{users.map((user) => <tr key={user.uid}><td className="px-5 py-4"><p className="font-medium">{user.displayName}</p><p className="mt-1 text-xs text-ink/45">{user.email || user.uid}</p></td><td className="px-4 py-4"><span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusTone[user.status] || statusTone.trial}`}>{user.status}</span><p className="mt-1 text-xs capitalize text-ink/45">{user.plan}</p></td><td className="px-4 py-4"><p>{user.conversions} conversions</p><p className="mt-1 text-xs text-ink/45">{user.plan === "trial" ? `${user.freeUploadsUsed}/3 free uploads` : `${user.completed} completed`}</p></td><td className="px-4 py-4"><p>{user.failed ? `${user.failed} failed` : "Healthy"}</p><p className="mt-1 text-xs text-ink/45">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "No activity"}</p></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{user.status === "suspended" ? <Button size="sm" variant="secondary" disabled={Boolean(busy)} onClick={() => updateUser(user, "reactivate")}><CheckCircle2 className="h-4 w-4" />Reactivate</Button> : <Button size="sm" variant="secondary" disabled={Boolean(busy)} onClick={() => updateUser(user, "suspend")}><ShieldBan className="h-4 w-4" />Suspend</Button>}<select aria-label={`Access action for ${user.email}`} className="h-9 rounded-md border border-line bg-white px-2 text-xs" disabled={Boolean(busy)} defaultValue="" onChange={(event) => { const value = event.target.value; event.target.value = ""; if (value === "reset") updateUser(user, "reset-free-uploads"); else if (value) updateUser(user, "grant-plan", value); }}><option value="" disabled>More</option><option value="reset">Reset free uploads</option><option value="monthly">Grant monthly</option><option value="yearly">Grant yearly</option></select></div></td></tr>)}</tbody></table>{!users.length && <p className="px-5 py-12 text-center text-ink/50">No users match these filters.</p>}</CardContent>
    </Card>
    <Card><CardHeader><h2 className="font-semibold">Administrator activity</h2></CardHeader><CardContent className="p-0">{data?.logs?.length ? <div className="divide-y divide-line">{data.logs.slice(0, 20).map((log, index) => <div key={`${log.createdAt}-${index}`} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[12rem_1fr_12rem]"><span className="text-ink/55">{new Date(log.createdAt).toLocaleString()}</span><span className="font-medium">{log.action.replaceAll("-", " ")}</span><span className="truncate text-ink/45">{log.actor}</span></div>)}</div> : <p className="px-5 py-10 text-center text-sm text-ink/50">No administrator actions recorded yet.</p>}</CardContent></Card>
  </div>;
}
