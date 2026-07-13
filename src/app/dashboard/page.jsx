import { ArrowUpRight, Clock, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { JobTable } from "@/components/video/job-table";
import { analytics, conversionJobs } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-ink/60">Monitor uploads, conversion activity, and subscription status.</p>
        </div>
        <Button asChild href="/dashboard/upload">
          <UploadCloud className="h-4 w-4" />
          Upload video
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.map((item) => <StatCard key={item.label} {...item} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Recent conversions</h2>
          </CardHeader>
          <CardContent>
            <JobTable jobs={conversionJobs.slice(0, 3)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Processing service</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-mist p-4">
              <Clock className="mb-3 h-5 w-5 text-mivim-600" />
              <p className="font-medium">Queue healthy</p>
              <p className="mt-1 text-sm text-ink/60">Jobs are validated locally, then sent to the FFmpeg worker endpoint.</p>
            </div>
            <Button asChild variant="secondary" href="/dashboard/history">
              View history <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
