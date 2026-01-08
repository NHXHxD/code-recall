import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import {
  PageHeaderSkeleton,
  ProblemCardSkeleton,
  GradeLegendSkeleton,
} from '@/components/ui/skeletons';

export default function ReviewLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeaderSkeleton />
        <Button variant="primary" size="lg" className="gap-2" disabled>
          <Play className="h-5 w-5" />
          Start Review
        </Button>
      </div>

      {/* Problem List */}
      <div className="space-y-3">
        <ProblemCardSkeleton />
        <ProblemCardSkeleton />
        <ProblemCardSkeleton />
      </div>

      {/* Grade Legend */}
      <GradeLegendSkeleton />
    </div>
  );
}
