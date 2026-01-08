import { getDashboardStats, getUpcomingReviews, getDueToday } from '@/lib/actions/reviews';
import { DashboardContent } from '@/components/dashboard-content';

export default async function DashboardPage() {
  const [stats, upcoming, dueToday] = await Promise.all([
    getDashboardStats(),
    getUpcomingReviews(),
    getDueToday(),
  ]);

  // Serialize data for client component
  const serializedDueToday = dueToday.map((problem) => ({
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
  }));

  return (
    <DashboardContent 
      stats={stats} 
      dueToday={serializedDueToday} 
      upcoming={upcoming} 
    />
  );
}
