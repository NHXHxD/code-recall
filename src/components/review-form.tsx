'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logReview } from '@/lib/actions/reviews';
import { GRADE_LABELS } from '@/lib/scheduling/sm2';
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
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Confidence Level
        </label>
        <div className="grid grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 5].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`p-3 rounded-lg border transition-all ${
                grade === g
                  ? getGradeSelectedStyle(g)
                  : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
              }`}
            >
              <span className={`text-lg font-bold ${grade === g ? 'text-white' : getGradeTextColor(g)}`}>
                {g}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-slate-400">
          <span className={getGradeTextColor(grade)}>{GRADE_LABELS[grade]?.label}</span>
          {' – '}
          {GRADE_LABELS[grade]?.description}
        </p>
      </div>

      {/* Outcome */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Outcome
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['solved', 'partial', 'failed'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(o)}
              className={`py-2 px-4 rounded-lg border transition-all capitalize ${
                outcome === o
                  ? getOutcomeStyle(o)
                  : 'border-slate-600 hover:border-slate-500 bg-slate-700/30 text-slate-300'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Time Spent */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Time Spent (minutes, optional)
        </label>
        <input
          type="number"
          value={timeSpent}
          onChange={(e) => setTimeSpent(e.target.value)}
          placeholder="e.g., 25"
          min="1"
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
        />
      </div>

      {/* Reflection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Reflection (optional)
        </label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What did you learn? What tripped you up?"
          rows={3}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-lg ${
          result.success 
            ? 'bg-emerald-500/20 border border-emerald-500/30' 
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          {result.success ? (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">
                Review logged! Next review: <strong>{result.nextDue}</strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-red-400">{result.error}</span>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Logging...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Log Review
          </>
        )}
      </button>
    </form>
  );
}

function getGradeTextColor(grade: number): string {
  const colors: Record<number, string> = {
    0: 'text-red-400',
    1: 'text-orange-400',
    2: 'text-yellow-400',
    3: 'text-lime-400',
    4: 'text-green-400',
    5: 'text-emerald-400',
  };
  return colors[grade] || 'text-slate-400';
}

function getGradeSelectedStyle(grade: number): string {
  const styles: Record<number, string> = {
    0: 'border-red-500 bg-red-500/20',
    1: 'border-orange-500 bg-orange-500/20',
    2: 'border-yellow-500 bg-yellow-500/20',
    3: 'border-lime-500 bg-lime-500/20',
    4: 'border-green-500 bg-green-500/20',
    5: 'border-emerald-500 bg-emerald-500/20',
  };
  return styles[grade] || 'border-slate-500 bg-slate-500/20';
}

function getOutcomeStyle(outcome: Outcome): string {
  const styles: Record<Outcome, string> = {
    solved: 'border-green-500 bg-green-500/20 text-green-400',
    partial: 'border-yellow-500 bg-yellow-500/20 text-yellow-400',
    failed: 'border-red-500 bg-red-500/20 text-red-400',
  };
  return styles[outcome];
}

