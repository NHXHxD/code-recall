import Link from 'next/link';
import { getDueToday } from '@/lib/actions/reviews';
import { GRADE_LABELS } from '@/lib/scheduling/sm2';
import { formatDistanceToNow } from 'date-fns';

export default async function ReviewQueuePage() {
  const dueProblems = await getDueToday();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Review Queue</h1>
          <p className="mt-1 text-slate-400">
            {dueProblems.length === 0 
              ? "You're all caught up!" 
              : `${dueProblems.length} problem${dueProblems.length === 1 ? '' : 's'} to review`}
          </p>
        </div>
        {dueProblems.length > 0 && (
          <Link
            href={`/problems/${dueProblems[0].id}`}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Review
          </Link>
        )}
      </div>

      {/* Empty State */}
      {dueProblems.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">All caught up!</h2>
          <p className="text-slate-400 mb-6">No problems due for review right now.</p>
          <Link
            href="/problems/new"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add a new problem
          </Link>
        </div>
      ) : (
        /* Problem List */
        <div className="space-y-3">
          {dueProblems.map((problem, index) => (
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
                          {GRADE_LABELS[problem.review_state.last_grade]?.label || problem.review_state.last_grade}
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
      )}

      {/* Confidence Scale Legend */}
      {dueProblems.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Confidence Scale Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(GRADE_LABELS).map(([grade, info]) => (
              <div key={grade} className="text-center p-2">
                <span className={`text-lg font-bold ${getGradeColor(Number(grade))}`}>
                  {grade}
                </span>
                <p className="text-xs text-slate-400 mt-1">{info.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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

