import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton loaders for various components in ReadDash
 * These provide visual feedback during loading states
 */

export function QuizCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
        <Skeleton className="absolute top-2 right-2 w-16 h-6" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressChartSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="h-64 flex items-end space-x-2">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <Skeleton className="w-full rounded-t-md" style={{ height: `${Math.random() * 80 + 20}%` }} />
              <Skeleton className="h-4 w-4 mt-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AchievementSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Progress charts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ProgressChartSkeleton />
        <ProgressChartSkeleton />
      </div>
      
      {/* Achievements skeleton */}
      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <AchievementSkeleton key={i} />
          ))}
        </div>
      </div>
      
      {/* Recommended quizzes skeleton */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <QuizCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}