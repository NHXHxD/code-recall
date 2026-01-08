'use client';

import Link from 'next/link';
import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { CountdownBadge } from './countdown-badge';
import { deleteProblem } from '@/lib/actions/problems';

interface ProblemItem {
  id: string;
  title: string;
  difficulty: string;
  topics: string[];
  url: string | null;
  created_at: string;
  review_state: {
    due_at: string;
    suspended: boolean;
    reps: number;
  } | null;
}

type SortOption = 'created' | 'title' | 'due' | 'difficulty';
type DifficultyFilter = 'all' | 'Easy' | 'Medium' | 'Hard';

interface ProblemsListClientProps {
  problems: ProblemItem[];
}

function getDifficultyOrder(difficulty: string): number {
  const order: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
  return order[difficulty] || 2;
}

export function ProblemsListClient({ problems }: ProblemsListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [showSuspended, setShowSuspended] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const handleDelete = (problemId: string) => {
    startTransition(async () => {
      const result = await deleteProblem(problemId);
      if (result.success) {
        setDeleteConfirm(null);
        router.refresh();
      }
    });
  };

  // Filter and sort problems
  const filteredProblems = useMemo(() => {
    let result = [...problems];

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.topics.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      result = result.filter(p => p.difficulty === difficultyFilter);
    }

    // Filter suspended
    if (!showSuspended) {
      result = result.filter(p => !p.review_state?.suspended);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'difficulty':
          return getDifficultyOrder(a.difficulty) - getDifficultyOrder(b.difficulty);
        case 'due':
          // Problems without review_state go last
          if (!a.review_state) return 1;
          if (!b.review_state) return -1;
          return new Date(a.review_state.due_at).getTime() - new Date(b.review_state.due_at).getTime();
        case 'created':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [problems, search, difficultyFilter, sortBy, showSuspended]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="created">Recently Added</option>
            <option value="due">Next Due</option>
            <option value="title">Title A-Z</option>
            <option value="difficulty">Difficulty</option>
          </select>

          {/* Show Suspended Toggle */}
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showSuspended}
              onChange={(e) => setShowSuspended(e.target.checked)}
              className="w-4 h-4 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-slate-600"
            />
            <span className="text-sm text-slate-300">Show suspended</span>
          </label>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-slate-400">
        Showing {filteredProblems.length} of {problems.length} problems
      </p>

      {/* Problems List */}
      {filteredProblems.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-8 text-center">
          <p className="text-slate-400">No problems match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProblems.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}`}
              className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl p-5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {problem.title}
                    </h3>
                    {problem.review_state?.suspended && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-600/50 text-slate-400 border border-slate-500/30">
                        Suspended
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    
                    {/* Countdown Badge */}
                    {problem.review_state && !problem.review_state.suspended && (
                      <CountdownBadge dueAt={problem.review_state.due_at} />
                    )}

                    {problem.review_state?.suspended && (
                      <span className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-500">
                        Reviews paused
                      </span>
                    )}
                    
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

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>
                      Added {formatDistanceToNow(new Date(problem.created_at), { addSuffix: true })}
                    </span>
                    {problem.review_state && (
                      <span>
                        Rep #{problem.review_state.reps + 1}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
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
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteConfirm({ id: problem.id, title: problem.title });
                    }}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Problem?</h3>
            <p className="text-slate-400 mb-6">
              This will permanently delete &quot;{deleteConfirm.title}&quot; and all its review history. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={isPending}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
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

