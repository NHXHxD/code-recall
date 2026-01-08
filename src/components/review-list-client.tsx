'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { CountdownBadge } from './countdown-badge';
import { DifficultyBadge } from './ui/difficulty-badge';
import { Badge } from './ui/badge';

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

interface ReviewListClientProps {
  problems: ReviewProblem[];
  gradeLabels: Record<number, GradeLabel>;
}

/**
 * Sort problems by:
 * 1. Overdue first (largest overdue first)
 * 2. Then by soonest due
 */
function sortProblemsByDue(problems: ReviewProblem[]): ReviewProblem[] {
  const now = Date.now();
  
  return [...problems].sort((a, b) => {
    const deltaA = new Date(a.review_state.due_at).getTime() - now;
    const deltaB = new Date(b.review_state.due_at).getTime() - now;
    
    const aOverdue = deltaA <= 0;
    const bOverdue = deltaB <= 0;
    
    // Both overdue: larger overdue (more negative) first
    if (aOverdue && bOverdue) {
      return deltaA - deltaB; // More negative = larger overdue = first
    }
    
    // Only one overdue: overdue first
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Neither overdue: soonest due first
    return deltaA - deltaB;
  });
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

export function ReviewListClient({ problems, gradeLabels }: ReviewListClientProps) {
  // Sort problems by due status (memoized to avoid re-sorting on each render)
  const sortedProblems = useMemo(() => sortProblemsByDue(problems), [problems]);

  if (sortedProblems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {sortedProblems.map((problem, index) => (
        <Link
          key={problem.id}
          href={`/problems/${problem.id}`}
          className="group block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:border-[var(--foreground-subtle)] hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <span className="font-mono text-sm text-[var(--foreground-muted)]">#{index + 1}</span>
                <h3 className="text-lg font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                  {problem.title}
                </h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <DifficultyBadge difficulty={problem.difficulty} />
                
                {/* Countdown Badge */}
                <CountdownBadge dueAt={problem.review_state.due_at} />
                
                {problem.topics.slice(0, 3).map((topic) => (
                  <Badge key={topic} variant="secondary" className="font-normal">
                    {topic}
                  </Badge>
                ))}
                
                {problem.topics.length > 3 && (
                  <span className="text-xs text-[var(--foreground-subtle)]">
                    +{problem.topics.length - 3} more
                  </span>
                )}
              </div>

              {/* Review State Info */}
              <div className="mt-3 flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
                {problem.review_state.last_grade !== null && (
                  <span className="flex items-center gap-1">
                    <span>Last:</span>
                    <span className={getGradeColor(problem.review_state.last_grade)}>
                      {gradeLabels[problem.review_state.last_grade]?.label || problem.review_state.last_grade}
                    </span>
                  </span>
                )}
                
                <span>
                  Rep #{problem.review_state.reps + 1}
                </span>
                
                {problem.review_state.last_review_at && (
                  <span>
                    Last reviewed {formatDistanceToNow(new Date(problem.review_state.last_review_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {problem.url && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(problem.url!, '_blank');
                  }}
                  className="flex items-center gap-1 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                >
                  LeetCode
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
              <ChevronRight className="h-5 w-5 text-[var(--foreground-subtle)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
