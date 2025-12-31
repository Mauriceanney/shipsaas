import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetricsGridSkeleton() {
  return (
    <ul
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      role="list"
      aria-label="Loading metrics"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
