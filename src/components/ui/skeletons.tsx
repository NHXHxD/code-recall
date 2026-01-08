import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "./card";

interface SkeletonProps {
  className?: string;
}

function Shimmer({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md skeleton-shimmer",
        className
      )}
    />
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Shimmer className="h-9 w-48" />
      <Shimmer className="h-5 w-64" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-8 w-12" />
        </div>
        <Shimmer className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

export function ProblemCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Title */}
          <Shimmer className="h-6 w-3/4 max-w-xs" />
          
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <Shimmer className="h-5 w-14 rounded-full" />
            <Shimmer className="h-5 w-20 rounded-full" />
            <Shimmer className="h-5 w-16 rounded-full" />
          </div>
          
          {/* Meta info */}
          <div className="flex items-center gap-4">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-16" />
          </div>
        </div>
        
        {/* Right side */}
        <Shimmer className="h-5 w-5 rounded" />
      </div>
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <Card className="border-[var(--border)]">
      <CardContent className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Search input */}
          <Shimmer className="h-9 flex-1 rounded-lg" />
          
          {/* Dropdowns */}
          <Shimmer className="h-9 w-36 rounded-lg" />
          <Shimmer className="h-9 w-36 rounded-lg" />
          
          {/* Checkbox */}
          <Shimmer className="h-9 w-32 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DueTodayCardSkeleton() {
  return (
    <Card className="border-[var(--border)]">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <Shimmer className="h-6 w-24" />
        <Shimmer className="h-8 w-28 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="flex-1 space-y-2">
              <Shimmer className="h-5 w-48" />
              <div className="flex items-center gap-2">
                <Shimmer className="h-5 w-14 rounded-full" />
                <Shimmer className="h-4 w-20" />
              </div>
            </div>
            <Shimmer className="h-5 w-5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function UpcomingCardSkeleton() {
  return (
    <Card className="border-[var(--border)]">
      <CardHeader className="pb-4">
        <Shimmer className="h-6 w-28" />
      </CardHeader>
      <CardContent className="space-y-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md px-2 py-2.5"
          >
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function GradeLegendSkeleton() {
  return (
    <Card className="border-[var(--border)]">
      <CardContent className="py-4">
        <Shimmer className="h-4 w-40 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="text-center p-2">
              <Shimmer className="h-6 w-6 mx-auto rounded" />
              <Shimmer className="h-3 w-12 mx-auto mt-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
