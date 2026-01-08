import Link from 'next/link';
import { getDueToday } from '@/lib/actions/reviews';
import { GRADE_LABELS } from '@/lib/scheduling/sm2';
import { ReviewListClient } from '@/components/review-list-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, Plus } from 'lucide-react';

export default async function ReviewQueuePage() {
  const dueProblems = await getDueToday();

  // Serialize problems for the client component
  const serializedProblems = dueProblems.map((problem) => ({
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
    url: problem.url,
    review_state: {
      due_at: problem.review_state.due_at,
      reps: problem.review_state.reps,
      last_grade: problem.review_state.last_grade,
      last_review_at: problem.review_state.last_review_at,
    },
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Review Queue</h1>
          <p className="mt-1 text-[var(--foreground-muted)]">
            {dueProblems.length === 0 
              ? "You're all caught up!" 
              : `${dueProblems.length} problem${dueProblems.length === 1 ? '' : 's'} to review`}
          </p>
        </div>
        {dueProblems.length > 0 && (
          <Link href={`/problems/${dueProblems[0].id}`}>
            <Button variant="primary" size="lg" className="gap-2">
              <Play className="h-5 w-5" />
              Start Review
            </Button>
          </Link>
        )}
      </div>

      {/* Empty State */}
      {dueProblems.length === 0 ? (
        <Card className="border-[var(--border)]">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10">
              <CheckCircle className="h-8 w-8 text-[var(--accent)]" />
            </div>
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
      ) : (
        /* Problem List with Live Countdown */
        <ReviewListClient 
          problems={serializedProblems} 
          gradeLabels={GRADE_LABELS} 
        />
      )}

      {/* Confidence Scale Legend */}
      {dueProblems.length > 0 && (
        <Card className="border-[var(--border)]">
          <CardContent className="py-4">
            <h3 className="text-sm font-medium text-[var(--foreground-muted)] mb-3">Confidence Scale Reference</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {Object.entries(GRADE_LABELS).map(([grade, info]) => (
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
      )}
    </div>
  );
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
