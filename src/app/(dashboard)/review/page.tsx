import { getDueToday } from '@/lib/actions/reviews';
import { GRADE_LABELS } from '@/lib/scheduling/sm2';
import { ReviewPageClient } from '@/components/review-page-client';

export default async function ReviewQueuePage() {
  const dueProblems = await getDueToday();

  // Serialize problems for the client component
  const serializedProblems = dueProblems.map((problem) => ({
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
    url: problem.url,
    review_state: {
      due_at: problem.review_state.due_at,
      reps: problem.review_state.reps,
      last_grade: problem.review_state.last_grade,
      last_review_at: problem.review_state.last_review_at,
    },
  }));

  return (
    <ReviewPageClient 
      problems={serializedProblems} 
      gradeLabels={GRADE_LABELS} 
    />
  );
}
