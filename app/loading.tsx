import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-lg">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
