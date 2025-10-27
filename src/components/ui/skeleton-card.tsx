import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

export const SkeletonCard = () => {
  return (
    <Card className="glass border-0">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
};

export const SkeletonPlanCard = () => {
  return (
    <Card className="glass border-0">
      <CardHeader className="text-center">
        <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto h-6 w-32 mb-2" />
        <Skeleton className="mx-auto h-4 w-48" />
        <Skeleton className="mx-auto mt-4 h-8 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-4 w-4 mr-2 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
          <Skeleton className="h-10 w-full mt-6" />
        </div>
      </CardContent>
    </Card>
  );
};

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
};
