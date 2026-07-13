import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, delta }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-ink/55">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-2 text-sm text-mivim-600">{delta}</p>
      </CardContent>
    </Card>
  );
}
