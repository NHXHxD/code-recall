'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  FolderOpen, 
  ChevronRight,
  Plus,
  Sparkles
} from 'lucide-react';

interface DashboardStats {
  due_today: number;
  due_this_week: number;
  reviews_today: number;
  total_problems: number;
}

interface DueProblem {
  id: string;
  title: string;
  difficulty: string;
  topics: string[];
}

interface UpcomingDay {
  date: string;
  count: number;
}

interface DashboardContentProps {
  stats: DashboardStats;
  dueToday: DueProblem[];
  upcoming: UpcomingDay[];
}

export function DashboardContent({ stats, dueToday, upcoming }: DashboardContentProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-1 text-[var(--foreground-muted)]">Your spaced repetition overview</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
        >
          <StatsCard
            title="Due Today"
            value={stats.due_today}
            icon={Clock}
            variant={stats.due_today > 0 ? "accent" : "default"}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatsCard
            title="This Week"
            value={stats.due_this_week}
            icon={Calendar}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <StatsCard
            title="Reviews Today"
            value={stats.reviews_today}
            icon={CheckCircle}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <StatsCard
            title="Total Problems"
            value={stats.total_problems}
            icon={FolderOpen}
          />
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Due Today Section */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-[var(--border)]">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Due Today</CardTitle>
              {stats.due_today > 0 && (
                <Link href="/review">
                  <Button variant="primary" size="sm" className="gap-2">
                    Start Review
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {dueToday.length === 0 ? (
                <div className="py-8 text-center">
                  <motion.div 
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                  >
                    <Sparkles className="h-7 w-7 text-[var(--accent)]" />
                  </motion.div>
                  <p className="font-medium text-[var(--foreground)]">All caught up!</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    No reviews due right now.
                  </p>
                  <Link href="/problems/new" className="mt-4 inline-block">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add a new problem
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {dueToday.slice(0, 5).map((problem, index) => (
                    <motion.div
                      key={problem.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                    >
                      <Link
                        href={`/problems/${problem.id}`}
                        className="group flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--foreground-subtle)] hover:shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[var(--foreground)] truncate">
                            {problem.title}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <DifficultyBadge difficulty={problem.difficulty} />
                            {problem.topics.slice(0, 2).map((topic) => (
                              <span 
                                key={topic} 
                                className="text-xs text-[var(--foreground-muted)]"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-[var(--foreground-subtle)] transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </motion.div>
                  ))}
                  {dueToday.length > 5 && (
                    <p className="pt-2 text-center text-sm text-[var(--foreground-muted)]">
                      +{dueToday.length - 5} more problems
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="border-[var(--border)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Next 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {upcoming.map((day, index) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                    className="flex items-center justify-between rounded-md px-2 py-2.5 transition-colors hover:bg-[var(--muted)]"
                  >
                    <span className={`text-sm ${
                      index === 0 
                        ? 'font-medium text-[var(--foreground)]' 
                        : 'text-[var(--foreground-muted)]'
                    }`}>
                      {index === 0 ? 'Today' : day.date}
                    </span>
                    <span className={`text-sm font-medium ${
                      day.count > 0 
                        ? index === 0 
                          ? 'text-[var(--accent)]' 
                          : 'text-[var(--foreground)]'
                        : 'text-[var(--foreground-subtle)]'
                    }`}>
                      {day.count} {day.count === 1 ? 'review' : 'reviews'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

