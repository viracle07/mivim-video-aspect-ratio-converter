import { Suspense } from "react";
import { BillingPanel } from "@/components/billing/billing-panel";

export default function BillingPage() {
  return <div className="space-y-6"><div><h1 className="text-3xl font-semibold">Billing</h1><p className="mt-1 text-ink/60">Manage your free uploads and Paystack subscription.</p></div><Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-white" />}><BillingPanel /></Suspense></div>;
}
