import {
  PageHeaderSkeleton,
  StatsCardSkeleton,
  DueTodayCardSkeleton,
  UpcomingCardSkeleton,
} from '@/components/ui/skeletons';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Due Today Section */}
        <div className="lg:col-span-2">
          <DueTodayCardSkeleton />
        </div>

        {/* Upcoming Reviews */}
        <UpcomingCardSkeleton />
      </div>
    </div>
  );
}
