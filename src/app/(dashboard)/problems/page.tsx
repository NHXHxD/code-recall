import Link from 'next/link';
import { getProblems } from '@/lib/actions/problems';
import { ProblemsListClient } from '@/components/problems-list-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen } from 'lucide-react';

export default async function AllProblemsPage() {
  const problems = await getProblems();

  // Serialize problems for the client component
  const serializedProblems = problems.map((problem) => ({
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
    url: problem.url,
    created_at: problem.created_at,
    review_state: problem.review_state ? {
      due_at: problem.review_state.due_at,
      suspended: problem.review_state.suspended,
      reps: problem.review_state.reps,
    } : null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">All Problems</h1>
          <p className="mt-1 text-[var(--foreground-muted)]">
            {problems.length === 0 
              ? "No problems yet" 
              : `${problems.length} problem${problems.length === 1 ? '' : 's'} in your library`}
          </p>
        </div>
        <Link href="/problems/new">
          <Button variant="primary" size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Add Problem
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {problems.length === 0 ? (
        <Card className="border-[var(--border)]">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
              <FolderOpen className="h-8 w-8 text-[var(--foreground-muted)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">No problems yet</h2>
            <p className="text-[var(--foreground-muted)] mb-6">Start building your LeetCode review library.</p>
            <Link href="/problems/new">
              <Button variant="primary" className="gap-2">
                <Plus className="h-5 w-5" />
                Add your first problem
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Problems List with Live Countdown */
        <ProblemsListClient problems={serializedProblems} />
      )}
    </div>
  );
}
