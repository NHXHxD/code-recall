import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProblem } from '@/lib/actions/problems';
import { getReviewHistory } from '@/lib/actions/reviews';
import { ReviewForm } from '@/components/review-form';
import { NotesEditor } from '@/components/notes-editor';
import { ReviewHistory } from '@/components/review-history';
import { ProblemDetailClient } from '@/components/problem-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProblemPage({ params }: Props) {
  const { id } = await params;
  const [problem, history] = await Promise.all([
    getProblem(id),
    getReviewHistory(id),
  ]);

  if (!problem) {
    notFound();
  }

  // Serialize problem data for the client component
  const problemData = {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
    url: problem.url,
    review_state: {
      due_at: problem.review_state.due_at,
      reps: problem.review_state.reps,
      ease: problem.review_state.ease,
      interval_days: problem.review_state.interval_days,
      suspended: problem.review_state.suspended,
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-4">
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Problems
        </Link>
        <span className="text-slate-600">|</span>
        <Link
          href="/review"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          Review Queue
        </Link>
      </div>

      {/* Problem Header (with edit capability) */}
      <ProblemDetailClient problem={problemData} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes Section */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <NotesEditor
            problemId={problem.id}
            initialContent={problem.notes?.content || ''}
            initialKeyIdea={problem.notes?.key_idea || null}
          />
        </div>

        {/* Review Form Section */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Log Review</h2>
          <ReviewForm problemId={problem.id} />
        </div>
      </div>

      {/* Review History */}
      <ReviewHistory problemId={problem.id} history={history} />
    </div>
  );
}
