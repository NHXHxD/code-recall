'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ReviewListClient } from './review-list-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, PartyPopper, Plus, AlertTriangle, Clock } from 'lucide-react';

interface ReviewProblem {
  id: string;
  title: string;
  difficulty: string;
  topics: string[];
  url: string | null;
  review_state: {
    due_at: string;
    reps: number;
    last_grade: number | null;
    last_review_at: string | null;
  };
}

interface GradeLabel {
  label: string;
  description: string;
  color: string;
}

interface ReviewPageClientProps {
  problems: ReviewProblem[];
  gradeLabels: Record<number, GradeLabel>;
}

function getGradeColor(grade: number): string {
  const colors: Record<number, string> = {
    0: 'text-red-500 dark:text-red-400',
    1: 'text-orange-500 dark:text-orange-400',
    2: 'text-yellow-500 dark:text-yellow-400',
    3: 'text-lime-500 dark:text-lime-400',
    4: 'text-green-500 dark:text-green-400',
    5: 'text-emerald-500 dark:text-emerald-400',
  };
  return colors[grade] || 'text-[var(--foreground-muted)]';
}

export function ReviewPageClient({ problems, gradeLabels }: ReviewPageClientProps) {
  // Calculate overdue vs due-today counts
  const now = Date.now();
  const overdueCount = problems.filter(p => new Date(p.review_state.due_at).getTime() <= now).length;
  const dueLaterCount = problems.length - overdueCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Review Queue</h1>
          <p className="mt-1 text-[var(--foreground-muted)]">
            {problems.length === 0 
              ? "You're all caught up!" 
              : `${problems.length} problem${problems.length === 1 ? '' : 's'} to review`}
          </p>
        </div>
        {problems.length > 0 && (
          <Link href={`/problems/${problems[0].id}`}>
            <Button variant="primary" size="lg" className="gap-2">
              <Play className="h-5 w-5" />
              Start Review
            </Button>
          </Link>
        )}
      </motion.div>

      {/* Summary Cards - Only show when there are problems */}
      {problems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Overdue Card */}
          <Card className={`border-[var(--border)] ${overdueCount > 0 ? 'border-l-4 border-l-red-500' : ''}`}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  overdueCount > 0 ? 'bg-red-500/10' : 'bg-[var(--muted)]'
                }`}>
                  <AlertTriangle className={`h-5 w-5 ${
                    overdueCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-[var(--foreground-muted)]'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">Overdue</p>
                  <p className={`text-2xl font-bold ${
                    overdueCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-[var(--foreground)]'
                  }`}>
                    {overdueCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Due Later Today Card */}
          <Card className="border-[var(--border)]">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                  <Clock className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">Due Later</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {dueLaterCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {problems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-[var(--border)]">
            <CardContent className="py-12 text-center">
              <motion.div 
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <PartyPopper className="h-8 w-8 text-[var(--accent)]" />
              </motion.div>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">All caught up!</h2>
              <p className="text-[var(--foreground-muted)] mb-6">No problems due for review right now.</p>
              <Link href="/problems/new">
                <Button variant="outline" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Add a new problem
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Problem List with Live Countdown */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <ReviewListClient 
            problems={problems} 
            gradeLabels={gradeLabels} 
          />
        </motion.div>
      )}

      {/* Confidence Scale Legend */}
      {problems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-[var(--border)]">
            <CardContent className="py-4">
              <h3 className="text-sm font-medium text-[var(--foreground-muted)] mb-3">Confidence Scale Reference</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {Object.entries(gradeLabels).map(([grade, info]) => (
                  <div key={grade} className="text-center p-2">
                    <span className={`text-lg font-bold ${getGradeColor(Number(grade))}`}>
                      {grade}
                    </span>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">{info.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
