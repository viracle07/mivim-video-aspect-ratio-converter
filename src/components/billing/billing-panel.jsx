"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, CreditCard, LoaderCircle, Settings } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { plans } from "@/lib/mock-data";
import { getWorkspaceStats } from "@/lib/workspace";

export function BillingPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activatePlan, workspace } = useWorkspace();
  const [configured, setConfigured] = useState(null);
  const [busyPlan, setBusyPlan] = useState("");
  const [message, setMessage] = useState("");
  const verifyingReference = useRef("");
  const stats = workspace ? getWorkspaceStats(workspace) : null;

  useEffect(() => {
    fetch("/api/paystack/status").then((response) => response.json()).then((result) => setConfigured(result.configured)).catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (!reference || !workspace || verifyingReference.current === reference) return;
    verifyingReference.current = reference;
    setBusyPlan("verify");
    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Payment verification failed.");
        activatePlan(result.plan, { reference: result.reference, amount: result.amount, currency: result.currency, paidAt: result.paidAt, customerCode: result.customerCode });
        setMessage("Payment verified. Your MiVim subscription is active.");
        router.replace("/dashboard/billing");
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setBusyPlan(""));
  }, [activatePlan, router, searchParams, workspace]);

  useEffect(() => {
    const reference = workspace?.billing?.reference;
    const activePlan = ["monthly", "yearly"].includes(workspace?.plan) && workspace?.billing?.status === "active";
    if (!activePlan || !reference || searchParams.get("reference") || searchParams.get("trxref") || verifyingReference.current === reference) return;
    verifyingReference.current = reference;
    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Existing payment could not be synchronized.");
        activatePlan(result.plan, { ...workspace.billing, reference: result.reference, paidAt: result.paidAt, customerCode: result.customerCode });
      })
      .catch(() => {})
      .finally(() => { verifyingReference.current = ""; });
  }, [activatePlan, searchParams, workspace]);

  async function choosePlan(plan) {
    setBusyPlan(plan); setMessage("");
    try {
      const response = await fetch("/api/paystack/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, plan }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment could not be started.");
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setMessage(error.message); setBusyPlan("");
    }
  }

  if (!workspace) return <div className="h-64 animate-pulse rounded-lg bg-white" />;
  const active = Boolean(workspace.entitlement?.paid) || (["monthly", "yearly"].includes(workspace.plan) && ["active", "non-renewing", "attention"].includes(workspace.billing?.status));
  return <div className="space-y-6">
    <Card><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-mist text-mivim-600">{active ? <CheckCircle2 className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}</div><div><p className="font-semibold">{active ? `${workspace.plan === "yearly" ? "Studio Yearly" : "Creator Monthly"} is active` : "Free uploads"}</p><p className="mt-1 text-sm text-ink/55">{active ? `${workspace.entitlement?.expiresAt ? `Access until ${new Date(workspace.entitlement.expiresAt).toLocaleDateString()}` : `Paid with Paystack · ${workspace.billing?.currency || "NGN"}`}` : `${stats?.freeUploadsRemaining ?? 0} of 3 free uploads remaining`}</p></div></div>{active && <span className="w-fit rounded-full bg-mivim-600 px-3 py-1 text-xs font-medium capitalize text-white">{workspace.entitlement?.status || "active"}</span>}</CardContent></Card>
    {configured === false && <div className="flex gap-3 rounded-md border border-amber/40 bg-amber/15 p-4"><Settings className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-medium">Paystack setup required</p><p className="mt-1 text-sm text-ink/65">Add your Paystack secret key, monthly plan code, and yearly plan code to <code>.env.local</code>, then restart MiVim.</p></div></div>}
    {busyPlan === "verify" && <div className="flex items-center gap-2 rounded-md bg-mist p-4 text-sm"><LoaderCircle className="h-4 w-4 animate-spin" />Verifying your Paystack payment...</div>}
    {message && <div className={`rounded-md p-4 text-sm ${message.startsWith("Payment verified") ? "bg-mivim-600/10 text-mivim-600" : "bg-coral/10 text-coral"}`}>{message}</div>}
    <div className="grid gap-4 lg:grid-cols-2">{plans.map((plan) => <Card key={plan.id} className={workspace.plan === plan.id ? "border-mivim-600" : ""}><CardHeader><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{plan.name}</h2>{workspace.plan === plan.id && <span className="text-xs font-medium text-mivim-600">Current plan</span>}</div><p className="mt-2 text-3xl font-semibold">{plan.price}<span className="text-base font-normal text-ink/55"> / {plan.cadence}</span></p></CardHeader><CardContent><ul className="space-y-3">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm text-ink/70"><Check className="h-4 w-4 text-mivim-600" />{feature}</li>)}</ul><Button className="mt-5 w-full" onClick={() => choosePlan(plan.id)} disabled={!configured || Boolean(busyPlan) || workspace.plan === plan.id}>{busyPlan === plan.id && <LoaderCircle className="h-4 w-4 animate-spin" />}{workspace.plan === plan.id ? "Current plan" : `Choose ${plan.name}`}</Button></CardContent></Card>)}</div>
    <p className="text-center text-xs text-ink/45">Payments are securely processed by Paystack. MiVim never receives or stores your card details.</p>
  </div>;
}
