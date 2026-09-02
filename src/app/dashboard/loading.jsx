export default function DashboardLoading() {
  return <div className="space-y-5" aria-label="Loading workspace"><div className="h-10 w-56 animate-pulse rounded-md bg-white" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-white" />)}</div><div className="h-80 animate-pulse rounded-lg bg-white" /></div>;
}
