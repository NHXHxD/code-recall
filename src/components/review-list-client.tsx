'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import { CountdownBadge } from './countdown-badge';
import { DifficultyBadge } from './ui/difficulty-badge';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

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
 * Sort and categorize problems by:
 * 1. Overdue first (largest overdue first)
 * 2. Then by soonest due
 */
function categorizeProblems(problems: ReviewProblem[]): {
  overdue: ReviewProblem[];
  dueLater: ReviewProblem[];
} {
  const now = Date.now();
  const overdue: ReviewProblem[] = [];
  const dueLater: ReviewProblem[] = [];
  
  for (const problem of problems) {
    const delta = new Date(problem.review_state.due_at).getTime() - now;
    if (delta <= 0) {
      overdue.push(problem);
    } else {
      dueLater.push(problem);
    }
  }
  
  // Sort overdue by most overdue first
  overdue.sort((a, b) => {
    const deltaA = new Date(a.review_state.due_at).getTime();
    const deltaB = new Date(b.review_state.due_at).getTime();
    return deltaA - deltaB;
  });
  
  // Sort due later by soonest first
  dueLater.sort((a, b) => {
    const deltaA = new Date(a.review_state.due_at).getTime();
    const deltaB = new Date(b.review_state.due_at).getTime();
    return deltaA - deltaB;
  });
  
  return { overdue, dueLater };
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

interface ProblemCardProps {
  problem: ReviewProblem;
  index: number;
  gradeLabels: Record<number, GradeLabel>;
  isOverdue: boolean;
}

function ProblemCard({ problem, index, gradeLabels, isOverdue }: ProblemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        href={`/problems/${problem.id}`}
        className={cn(
          "group block rounded-xl border bg-[var(--card)] p-5 transition-all hover:shadow-md",
          isOverdue 
            ? "border-red-500/30 border-l-4 border-l-red-500 hover:border-red-500/50" 
            : "border-[var(--border)] hover:border-[var(--foreground-subtle)]"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-3">
              <span className={cn(
                "font-mono text-sm",
                isOverdue ? "text-red-500 dark:text-red-400" : "text-[var(--foreground-muted)]"
              )}>
                #{index + 1}
              </span>
              <h3 className="text-lg font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] truncate">
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
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--foreground-muted)]">
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
                <span className="hidden sm:inline">
                  Last reviewed {formatDistanceToNow(new Date(problem.review_state.last_review_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
            {problem.url && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.open(problem.url!, '_blank');
                }}
                className="hidden sm:flex items-center gap-1 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
              >
                LeetCode
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronRight className="h-5 w-5 text-[var(--foreground-subtle)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ReviewListClient({ problems, gradeLabels }: ReviewListClientProps) {
  // Categorize problems by due status
  const { overdue, dueLater } = useMemo(() => categorizeProblems(problems), [problems]);

  if (problems.length === 0) {
    return null;
  }

  const hasOverdue = overdue.length > 0;
  const hasDueLater = dueLater.length > 0;
  const showSections = hasOverdue && hasDueLater;

  return (
    <div className="space-y-6">
      {/* Overdue Section */}
      {hasOverdue && (
        <div className="space-y-3">
          {showSections && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-red-500 dark:text-red-400"
            >
              <AlertTriangle className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Overdue ({overdue.length})
              </h2>
            </motion.div>
          )}
          <div className="space-y-3">
            {overdue.map((problem, index) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                index={index}
                gradeLabels={gradeLabels}
                isOverdue={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Due Later Section */}
      {hasDueLater && (
        <div className="space-y-3">
          {showSections && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: overdue.length * 0.05 }}
              className="flex items-center gap-2 text-[var(--accent)]"
            >
              <Clock className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Due Later Today ({dueLater.length})
              </h2>
            </motion.div>
          )}
          <div className="space-y-3">
            {dueLater.map((problem, index) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                index={overdue.length + index}
                gradeLabels={gradeLabels}
                isOverdue={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
