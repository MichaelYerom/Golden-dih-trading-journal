import { Skeleton } from "@/components/ui/skeleton";

export default function SessionLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Back button & header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8.5 w-16 rounded-lg" />
          <Skeleton className="h-8.5 w-24 rounded-lg" />
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-3.5 space-y-1.5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        ))}
      </div>

      {/* Equity curve chart skeleton */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>

      {/* Trade table skeleton */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
