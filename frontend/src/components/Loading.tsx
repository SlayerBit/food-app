import { Skeleton } from "./Skeleton";

export const Loading = () => (
  <div className="space-y-4 py-8">
    <Skeleton className="h-10 w-48" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card overflow-hidden">
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
