import Link from 'next/link';
import { getDashboardStats, getUpcomingReviews, getDueToday } from '@/lib/actions/reviews';

export default async function DashboardPage() {
  const [stats, upcoming, dueToday] = await Promise.all([
    getDashboardStats(),
    getUpcomingReviews(),
    getDueToday(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-slate-400">Your spaced repetition overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Due Today"
          value={stats.due_today}
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="This Week"
          value={stats.due_this_week}
          color="cyan"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Reviews Today"
          value={stats.reviews_today}
          color="violet"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Problems"
          value={stats.total_problems}
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Due Today Section */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Due Today</h2>
            {stats.due_today > 0 && (
              <Link
                href="/review"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Start Review →
              </Link>
            )}
          </div>

          {dueToday.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-700/50 mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-400">All caught up! No reviews due.</p>
              <Link
                href="/problems/new"
                className="inline-block mt-4 text-sm text-emerald-400 hover:text-emerald-300"
              >
                Add a new problem
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dueToday.slice(0, 5).map((problem) => (
                <Link
                  key={problem.id}
                  href={`/problems/${problem.id}`}
                  className="block p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">{problem.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <DifficultyBadge difficulty={problem.difficulty} />
                        {problem.topics.slice(0, 2).map((topic) => (
                          <span key={topic} className="text-xs text-slate-400">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
              {dueToday.length > 5 && (
                <p className="text-sm text-slate-400 text-center pt-2">
                  +{dueToday.length - 5} more problems
                </p>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Reviews */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Next 7 Days</h2>
          <div className="space-y-3">
            {upcoming.map((day, index) => (
              <div
                key={day.date}
                className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
              >
                <span className={`text-sm ${index === 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                  {index === 0 ? 'Today' : day.date}
                </span>
                <span className={`text-sm font-medium ${
                  day.count > 0 
                    ? index === 0 ? 'text-emerald-400' : 'text-slate-300'
                    : 'text-slate-500'
                }`}>
                  {day.count} {day.count === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: 'emerald' | 'cyan' | 'violet' | 'amber';
  icon: React.ReactNode;
}) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={colorClasses[color]}>{icon}</div>
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    Easy: 'bg-green-500/20 text-green-400',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    Hard: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[difficulty as keyof typeof colors] || colors.Medium}`}>
      {difficulty}
    </span>
  );
}

