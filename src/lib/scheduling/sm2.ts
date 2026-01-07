import { addDays } from 'date-fns';

/**
 * SM-2 Spaced Repetition Algorithm
 * Adapted for LeetCode problem retention
 * 
 * Confidence Scale:
 * 0 → blanked (complete blackout)
 * 1 → heavy hints needed
 * 2 → partial solution
 * 3 → solved but shaky
 * 4 → solid solution
 * 5 → can re-derive and explain
 */

export interface ReviewState {
  due_at: Date;
  interval_days: number;
  ease: number;
  reps: number;
  last_review_at: Date | null;
  last_grade: number | null;
}

export interface SchedulingResult {
  due_at: Date;
  interval_days: number;
  ease: number;
  reps: number;
  last_review_at: Date;
  last_grade: number;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate initial ease factor based on first confidence rating
 * Higher initial confidence = higher starting ease
 */
export function getInitialEase(grade: number): number {
  // Map grades 0-5 to ease 1.8-2.5
  const baseEase = 1.8 + (grade / 5) * 0.7;
  return clamp(baseEase, 1.3, 2.8);
}

/**
 * Calculate the next review state based on current state and grade
 * 
 * @param current - Current review state
 * @param grade - User's confidence grade (0-5)
 * @param tookTooLong - Optional: if true, applies a 0.8 penalty to interval
 * @returns New review state
 */
export function calculateNextReview(
  current: ReviewState,
  grade: number,
  tookTooLong: boolean = false
): SchedulingResult {
  const now = new Date();
  
  // Validate grade
  const safeGrade = clamp(Math.round(grade), 0, 5);
  
  // Grade < 3: Reset progress (failed recall)
  if (safeGrade < 3) {
    return {
      reps: 0,
      interval_days: 1,
      ease: Math.max(1.3, current.ease - 0.2),
      due_at: addDays(now, 1),
      last_review_at: now,
      last_grade: safeGrade,
    };
  }
  
  // Grade >= 3: Successful recall, advance schedule
  const newReps = current.reps + 1;
  let interval: number;
  
  if (newReps === 1) {
    interval = 1;
  } else if (newReps === 2) {
    interval = 3;
  } else {
    interval = current.interval_days * current.ease;
  }
  
  // Apply penalty for taking too long (optional)
  if (tookTooLong) {
    interval = interval * 0.8;
  }
  
  // Update ease factor using SM-2 formula
  // ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  const easeDelta = 0.1 - (5 - safeGrade) * (0.08 + (5 - safeGrade) * 0.02);
  const newEase = clamp(current.ease + easeDelta, 1.3, 2.8);
  
  return {
    reps: newReps,
    interval_days: Math.round(interval * 10) / 10, // Round to 1 decimal
    ease: Math.round(newEase * 100) / 100, // Round to 2 decimals
    due_at: addDays(now, Math.ceil(interval)),
    last_review_at: now,
    last_grade: safeGrade,
  };
}

/**
 * Create initial review state for a new problem
 * 
 * @param initialGrade - User's initial confidence (0-5)
 * @returns Initial review state
 */
export function createInitialReviewState(initialGrade: number): SchedulingResult {
  const now = new Date();
  const safeGrade = clamp(Math.round(initialGrade), 0, 5);
  
  // First review is always tomorrow for new problems
  // Initial ease depends on confidence
  return {
    reps: 0,
    interval_days: 1,
    ease: getInitialEase(safeGrade),
    due_at: addDays(now, 1),
    last_review_at: now,
    last_grade: safeGrade,
  };
}

/**
 * Grade labels for UI display
 */
export const GRADE_LABELS: Record<number, { label: string; description: string; color: string }> = {
  0: { label: 'Blanked', description: 'Complete blackout, no idea where to start', color: 'red' },
  1: { label: 'Heavy Hints', description: 'Needed significant help to solve', color: 'orange' },
  2: { label: 'Partial', description: 'Got partway but got stuck', color: 'yellow' },
  3: { label: 'Shaky', description: 'Solved it but felt uncertain', color: 'lime' },
  4: { label: 'Solid', description: 'Solved confidently with good approach', color: 'green' },
  5: { label: 'Perfect', description: 'Can re-derive and explain to others', color: 'emerald' },
};

