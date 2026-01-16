import { getDashboardStats, getUpcomingReviews, getDueToday } from '@/lib/actions/reviews';
import { getProblemsAddedToday } from '@/lib/actions/problems';
import { DashboardContent } from '@/components/dashboard-content';

export default async function DashboardPage() {
  const [stats, upcoming, dueToday, addedToday] = await Promise.all([
    getDashboardStats(),
    getUpcomingReviews(),
    getDueToday(),
    getProblemsAddedToday(),
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
      addedToday={addedToday}
    />
  );
}
