import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProblem } from '@/lib/actions/problems';
import { getReviewHistory } from '@/lib/actions/reviews';
import { ReviewForm } from '@/components/review-form';
import { NotesEditor } from '@/components/notes-editor';
import { ReviewHistory } from '@/components/review-history';
import { ProblemDetailClient } from '@/components/problem-detail-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

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
      difficulty: problem.review_state.difficulty,
      stability: problem.review_state.stability,
      interval_days: problem.review_state.interval_days,
      suspended: problem.review_state.suspended,
    },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-4">
        <Link href="/problems">
          <Button variant="ghost" size="sm" className="gap-2 text-[var(--foreground-muted)]">
            <ChevronLeft className="h-4 w-4" />
            All Problems
          </Button>
        </Link>
        <span className="text-[var(--border)]">|</span>
        <Link href="/review">
          <Button variant="ghost" size="sm" className="text-[var(--foreground-muted)]">
            Review Queue
          </Button>
        </Link>
      </div>

      {/* Problem Header (with edit capability) */}
      <ProblemDetailClient problem={problemData} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Notes Section */}
        <Card className="border-[var(--border)]">
          <CardContent className="pt-6">
            <NotesEditor
              problemId={problem.id}
              initialContent={problem.notes?.content || ''}
              initialKeyIdea={problem.notes?.key_idea || null}
            />
          </CardContent>
        </Card>

        {/* Review Form Section */}
        <Card className="border-[var(--border)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Log Review</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm problemId={problem.id} />
          </CardContent>
        </Card>
      </div>

      {/* Review History */}
      <ReviewHistory problemId={problem.id} history={history} />
    </div>
  );
}
