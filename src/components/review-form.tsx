'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { logReview } from '@/lib/actions/reviews';
import { GRADE_LABELS } from '@/lib/scheduling/sm2';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { Outcome } from '@/types/database';

interface ReviewFormProps {
  problemId: string;
}

export function ReviewForm({ problemId }: ReviewFormProps) {
  const router = useRouter();
  const [grade, setGrade] = useState<number>(3);
  const [outcome, setOutcome] = useState<Outcome>('solved');
  const [reflection, setReflection] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; nextDue?: string; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await logReview({
        problem_id: problemId,
        grade,
        outcome,
        reflection: reflection || undefined,
        time_spent: timeSpent ? parseInt(timeSpent) * 60 : undefined, // Convert minutes to seconds
      });

      setResult(res);
      
      if (res.success) {
        // Refresh the page data
        router.refresh();
      }
    } catch (error) {
      setResult({ success: false, error: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Confidence Grade */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[var(--foreground)]">
          Confidence Level
        </label>
        <div className="grid grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 5].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={cn(
                "rounded-lg border p-3 transition-all",
                grade === g
                  ? getGradeSelectedStyle(g)
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--foreground-subtle)]'
              )}
            >
              <span className={cn(
                "text-lg font-bold",
                grade === g ? 'text-[var(--foreground)]' : getGradeTextColor(g)
              )}>
                {g}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          <span className={getGradeTextColor(grade)}>{GRADE_LABELS[grade]?.label}</span>
          {' – '}
          {GRADE_LABELS[grade]?.description}
        </p>
      </div>

      {/* Outcome */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[var(--foreground)]">
          Outcome
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['solved', 'partial', 'failed'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(o)}
              className={cn(
                "rounded-lg border py-2 px-4 capitalize transition-all",
                outcome === o
                  ? getOutcomeStyle(o)
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
              )}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Time Spent */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Time Spent (minutes, optional)
        </label>
        <Input
          type="number"
          value={timeSpent}
          onChange={(e) => setTimeSpent(e.target.value)}
          placeholder="e.g., 25"
          min="1"
        />
      </div>

      {/* Reflection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Reflection (optional)
        </label>
        <Textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What did you learn? What tripped you up?"
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Result Message */}
      {result && (
        <div className={cn(
          "rounded-lg border p-4",
          result.success 
            ? 'border-[var(--accent)]/20 bg-[var(--accent)]/10' 
            : 'border-red-500/20 bg-red-500/10'
        )}>
          {result.success ? (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-[var(--accent)]" />
              <span className="text-[var(--accent)]">
                Review logged! Next review: <strong>{result.nextDue}</strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-red-500 dark:text-red-400">{result.error}</span>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        loading={isSubmitting}
        loadingText="Logging..."
        className="w-full gap-2"
      >
        <Check className="h-5 w-5" />
        Log Review
      </Button>
    </form>
  );
}

function getGradeTextColor(grade: number): string {
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

function getGradeSelectedStyle(grade: number): string {
  const styles: Record<number, string> = {
    0: 'border-red-500/50 bg-red-500/10',
    1: 'border-orange-500/50 bg-orange-500/10',
    2: 'border-yellow-500/50 bg-yellow-500/10',
    3: 'border-lime-500/50 bg-lime-500/10',
    4: 'border-green-500/50 bg-green-500/10',
    5: 'border-emerald-500/50 bg-emerald-500/10',
  };
  return styles[grade] || 'border-[var(--border)] bg-[var(--muted)]';
}

function getOutcomeStyle(outcome: Outcome): string {
  const styles: Record<Outcome, string> = {
    solved: 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400',
    partial: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    failed: 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400',
  };
  return styles[outcome];
}
