import Link from 'next/link';
import { getProblems } from '@/lib/actions/problems';
import { ProblemsListClient } from '@/components/problems-list-client';

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
          <h1 className="text-3xl font-bold text-white">All Problems</h1>
          <p className="mt-1 text-slate-400">
            {problems.length === 0 
              ? "No problems yet" 
              : `${problems.length} problem${problems.length === 1 ? '' : 's'} in your library`}
          </p>
        </div>
        <Link
          href="/problems/new"
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Problem
        </Link>
      </div>

      {/* Empty State */}
      {problems.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No problems yet</h2>
          <p className="text-slate-400 mb-6">Start building your LeetCode review library.</p>
          <Link
            href="/problems/new"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add your first problem
          </Link>
        </div>
      ) : (
        /* Problems List with Live Countdown */
        <ProblemsListClient problems={serializedProblems} />
      )}
    </div>
  );
}

