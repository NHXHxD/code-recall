'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CountdownBadge } from './countdown-badge';

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
    0: 'text-red-400',
    1: 'text-orange-400',
    2: 'text-yellow-400',
    3: 'text-lime-400',
    4: 'text-green-400',
    5: 'text-emerald-400',
  };
  return colors[grade] || 'text-slate-400';
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    Easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded border ${colors[difficulty as keyof typeof colors] || colors.Medium}`}>
      {difficulty}
    </span>
  );
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
          className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl p-5 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-slate-500 font-mono">#{index + 1}</span>
                <h3 className="text-lg font-medium text-white group-hover:text-emerald-400 transition-colors">
                  {problem.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <DifficultyBadge difficulty={problem.difficulty} />
                
                {/* Countdown Badge */}
                <CountdownBadge dueAt={problem.review_state.due_at} />
                
                {problem.topics.slice(0, 3).map((topic) => (
                  <span
                    key={topic}
                    className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-400"
                  >
                    {topic}
                  </span>
                ))}
                
                {problem.topics.length > 3 && (
                  <span className="text-xs text-slate-500">
                    +{problem.topics.length - 3} more
                  </span>
                )}
              </div>

              {/* Review State Info */}
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
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
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(problem.url!, '_blank');
                  }}
                  className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  LeetCode ↗
                </span>
              )}
              <svg 
                className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

