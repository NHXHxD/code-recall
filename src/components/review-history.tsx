'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteReviewLog } from '@/lib/actions/reviews';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ReviewHistoryEntry {
  id: string;
  reviewed_at: string;
  grade: number;
  outcome: string | null;
}

interface ReviewHistoryProps {
  problemId: string;
  history: ReviewHistoryEntry[];
}

export function ReviewHistory({ problemId, history: initialHistory }: ReviewHistoryProps) {
  const [history, setHistory] = useState(initialHistory);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review entry?')) {
      return;
    }

    setDeletingId(reviewId);
    setError(null);

    try {
      const result = await deleteReviewLog(reviewId, problemId);
      if (result.success) {
        setHistory(prev => prev.filter(entry => entry.id !== reviewId));
      } else {
        setError(result.error || 'Failed to delete review');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className="border-[var(--border)]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Review History</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-1">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="group flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--muted)]"
            >
              <span className="text-sm text-[var(--foreground-muted)]">
                {format(new Date(entry.reviewed_at), 'MMM d, yyyy h:mm a')}
              </span>
              <div className="flex items-center gap-3">
                {entry.outcome && (
                  <OutcomeBadge outcome={entry.outcome} />
                )}
                <GradeBadge grade={entry.grade} />
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="rounded p-1 text-[var(--foreground-subtle)] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 group-hover:opacity-100"
                  title="Delete this review"
                >
                  {deletingId === entry.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GradeBadge({ grade }: { grade: number }) {
  const variants: Record<number, "destructive" | "warning" | "success" | "secondary"> = {
    0: 'destructive',
    1: 'warning',
    2: 'warning',
    3: 'secondary',
    4: 'success',
    5: 'success',
  };

  return (
    <Badge variant={variants[grade] || 'secondary'}>
      Grade: {grade}
    </Badge>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const variants: Record<string, "success" | "warning" | "destructive"> = {
    solved: 'success',
    partial: 'warning',
    failed: 'destructive',
  };

  return (
    <span className={`text-sm capitalize ${
      outcome === 'solved' ? 'text-green-600 dark:text-green-400' :
      outcome === 'partial' ? 'text-yellow-600 dark:text-yellow-400' :
      outcome === 'failed' ? 'text-red-600 dark:text-red-400' :
      'text-[var(--foreground-muted)]'
    }`}>
      {outcome}
    </span>
  );
}
