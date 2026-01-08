'use client';

import Link from 'next/link';
import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Search, ChevronRight, ExternalLink, Trash2 } from 'lucide-react';
import { CountdownBadge } from './countdown-badge';
import { DifficultyBadge } from './ui/difficulty-badge';
import { deleteProblem } from '@/lib/actions/problems';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

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
      <Card className="border-[var(--border)]">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <Input
                type="text"
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
              className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
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
              className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="created">Recently Added</option>
              <option value="due">Next Due</option>
              <option value="title">Title A-Z</option>
              <option value="difficulty">Difficulty</option>
            </select>

            {/* Show Suspended Toggle */}
            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3">
              <input
                type="checkbox"
                checked={showSuspended}
                onChange={(e) => setShowSuspended(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground-muted)]">Show suspended</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <p className="text-sm text-[var(--foreground-muted)]">
        Showing {filteredProblems.length} of {problems.length} problems
      </p>

      {/* Problems List */}
      {filteredProblems.length === 0 ? (
        <Card className="border-[var(--border)]">
          <CardContent className="py-8 text-center">
            <p className="text-[var(--foreground-muted)]">No problems match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProblems.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}`}
              className="group block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:border-[var(--foreground-subtle)] hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                      {problem.title}
                    </h3>
                    {problem.review_state?.suspended && (
                      <Badge variant="secondary">Suspended</Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    
                    {/* Countdown Badge */}
                    {problem.review_state && !problem.review_state.suspended && (
                      <CountdownBadge dueAt={problem.review_state.due_at} />
                    )}

                    {problem.review_state?.suspended && (
                      <Badge variant="secondary" className="font-normal">
                        Reviews paused
                      </Badge>
                    )}
                    
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

                  {/* Meta Info */}
                  <div className="mt-3 flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
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
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteConfirm({ id: problem.id, title: problem.title });
                    }}
                    className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] transition-colors hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="mx-4 w-full max-w-md border-[var(--border)]">
            <CardContent className="pt-6">
              <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Delete Problem?</h3>
              <p className="mb-6 text-[var(--foreground-muted)]">
                This will permanently delete &quot;{deleteConfirm.title}&quot; and all its review history. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDelete(deleteConfirm.id)}
                  disabled={isPending}
                >
                  {isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
