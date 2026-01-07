'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { deleteReviewLog } from '@/lib/actions/reviews';

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
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Review History</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0 group"
          >
            <span className="text-sm text-slate-400">
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
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 disabled:opacity-50 transition-all p-1"
                title="Delete this review"
              >
                {deletingId === entry.id ? (
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: number }) {
  const colors: Record<number, string> = {
    0: 'bg-red-500/20 text-red-400',
    1: 'bg-orange-500/20 text-orange-400',
    2: 'bg-yellow-500/20 text-yellow-400',
    3: 'bg-lime-500/20 text-lime-400',
    4: 'bg-green-500/20 text-green-400',
    5: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <span className={`text-sm px-2 py-1 rounded ${colors[grade] || 'bg-slate-500/20 text-slate-400'}`}>
      Grade: {grade}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const colors = {
    solved: 'text-green-400',
    partial: 'text-yellow-400',
    failed: 'text-red-400',
  };

  return (
    <span className={`text-sm ${colors[outcome as keyof typeof colors] || 'text-slate-400'}`}>
      {outcome}
    </span>
  );
}

