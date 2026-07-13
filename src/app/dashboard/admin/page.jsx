import { Activity, Database, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const rows = [
  ["Active users", "2,184", "+12%"],
  ["Paid subscriptions", "436", "+31"],
  ["Failed jobs", "8", "needs review"],
  ["Storage usage", "1.8 TB", "72%"]
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="mt-1 text-ink/60">Operational overview for users, subscriptions, analytics, and logs.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><Users className="mb-3 h-5 w-5 text-mivim-600" /><p className="font-medium">User management</p><p className="mt-1 text-sm text-ink/55">Profiles, roles, trial status.</p></CardContent></Card>
        <Card><CardContent><Database className="mb-3 h-5 w-5 text-coral" /><p className="font-medium">System logs</p><p className="mt-1 text-sm text-ink/55">Upload and worker events.</p></CardContent></Card>
        <Card><CardContent><Activity className="mb-3 h-5 w-5 text-amber" /><p className="font-medium">Revenue analytics</p><p className="mt-1 text-sm text-ink/55">Stripe plan metrics.</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold">Admin metrics</h2></CardHeader>
        <CardContent>
          <div className="divide-y divide-line">
            {rows.map(([label, value, note]) => (
              <div key={label} className="flex items-center justify-between py-3">
                <span className="text-ink/70">{label}</span>
                <span className="font-medium">{value} <span className="ml-2 text-sm font-normal text-ink/50">{note}</span></span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
