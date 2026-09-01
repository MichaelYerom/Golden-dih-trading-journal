import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-8.5 w-28 rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-3 w-28" />
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-secondary rounded-md">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
