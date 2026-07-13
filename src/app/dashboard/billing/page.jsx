import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { plans } from "@/lib/mock-data";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Billing</h1>
        <p className="mt-1 text-ink/60">Manage free trial enforcement and Stripe subscriptions.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="text-3xl font-semibold">{plan.price}<span className="text-base font-normal text-ink/55"> / {plan.cadence}</span></p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-ink/70">
                    <Check className="h-4 w-4 text-mivim-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <form action="/api/stripe/checkout" method="POST">
                <input type="hidden" name="plan" value={plan.id} />
                <Button className="mt-5 w-full">Choose plan</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
