import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  PageHeaderSkeleton,
  FilterBarSkeleton,
  ProblemCardSkeleton,
} from '@/components/ui/skeletons';

export default function ProblemsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeaderSkeleton />
        <Button variant="primary" size="lg" className="gap-2" disabled>
          <Plus className="h-5 w-5" />
          Add Problem
        </Button>
      </div>

      {/* Filter Bar */}
      <FilterBarSkeleton />

      {/* Results Count */}
      <div className="h-5 w-48 skeleton-shimmer rounded" />

      {/* Problems List */}
      <div className="space-y-3">
        <ProblemCardSkeleton />
        <ProblemCardSkeleton />
        <ProblemCardSkeleton />
        <ProblemCardSkeleton />
      </div>
    </div>
  );
}
