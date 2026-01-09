import { addDays } from 'date-fns';

/**
 * FSRS-based Spaced Repetition Scheduler
 * Adapted for LeetCode problem retention
 *
 * This scheduler uses a simplified FSRS (Free Spaced Repetition Scheduler) model
 * with two core parameters:
 *
 * - Difficulty (D): How inherently hard the problem is to remember (1-10 scale).
 *   Lower values mean easier problems that require less frequent review.
 *   Difficulty increases on failures and decreases on successful recalls.
 *
 * - Stability (S): The memory stability in days - roughly how long until
 *   recall probability drops to the target retention (e.g., 90%).
 *   Stability grows with successful reviews and shrinks sharply on failures.
 *
 * Confidence Scale (grade 0-5):
 * 0 → blanked (complete blackout)
 * 1 → heavy hints needed
 * 2 → partial solution
 * 3 → solved but shaky
 * 4 → solid solution
 * 5 → can re-derive and explain
 *
 * Rating Mapping:
 * - Grade 0-1 → Again (complete failure, needs immediate re-review)
 * - Grade 2   → Hard (struggled significantly)
 * - Grade 3-4 → Good (successful recall)
 * - Grade 5   → Easy (effortless recall)
 *
 * tookTooLong Effect:
 * When tookTooLong is true, the rating is downgraded one level:
 * Easy → Good, Good → Hard, Hard → Again, Again → Again (no change)
 *
 * Migration Note:
 * For existing SM-2 data with ease/interval_days/reps fields:
 * - difficulty = clamp(11 - ease * 4, 1, 10)  // ease 2.5 → D ~1, ease 1.3 → D ~5.8
 * - stability = interval_days                  // current interval as initial stability
 * - lapses = 0                                 // reset or estimate from history
 */

// ============================================
// TUNABLE CONSTANTS
// ============================================

/** Default difficulty for new problems (1-10 scale, lower = easier) */
const DEFAULT_DIFFICULTY = 5.0;

/** Default stability in days for brand new problems */
const DEFAULT_STABILITY = 1.0;

/** Target retention probability (0.90 = 90% chance of recall at due date) */
const RETENTION_TARGET = 0.90;

/** Minimum allowed difficulty */
const MIN_DIFFICULTY = 1.0;

/** Maximum allowed difficulty */
const MAX_DIFFICULTY = 10.0;

/** Minimum allowed stability in days */
const MIN_STABILITY = 0.1;

/** Maximum allowed stability in days (1 year cap) */
const MAX_STABILITY = 365.0;

/**
 * Stability multipliers per rating.
 * These control how stability changes after each review.
 */
const STABILITY_MULTIPLIERS = {
  AGAIN: 0.2,  // Sharp decrease on failure
  HARD: 0.8,   // Slight decrease
  GOOD: 1.0,   // Maintain (base, modified by difficulty factor)
  EASY: 1.3,   // Increase
};

/**
 * Difficulty adjustment per rating.
 * Positive = harder, Negative = easier.
 */
const DIFFICULTY_DELTAS = {
  AGAIN: 0.5,   // Failure makes it harder
  HARD: 0.15,   // Struggle increases difficulty slightly
  GOOD: -0.1,   // Success decreases difficulty
  EASY: -0.3,   // Easy recall decreases difficulty more
};

/**
 * Base stability growth factor for successful reviews.
 * Higher difficulty reduces growth; lower difficulty increases it.
 */
const STABILITY_GROWTH_BASE = 2.0;

// ============================================
// TYPES
// ============================================

/** FSRS Rating levels */
type Rating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface ReviewState {
  due_at: Date;
  interval_days: number;
  difficulty: number;
  stability: number;
  reps: number;
  lapses: number;
  last_review_at: Date | null;
  last_grade: number | null;
}

export interface SchedulingResult {
  due_at: Date;
  interval_days: number;
  difficulty: number;
  stability: number;
  reps: number;
  lapses: number;
  last_review_at: Date;
  last_grade: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map a grade (0-5) to an FSRS rating
 */
function gradeToRating(grade: number): Rating {
  if (grade <= 1) return 'AGAIN';
  if (grade === 2) return 'HARD';
  if (grade <= 4) return 'GOOD';
  return 'EASY';
}

/**
 * Downgrade a rating by one level (used when tookTooLong is true)
 */
function downgradeRating(rating: Rating): Rating {
  switch (rating) {
    case 'EASY': return 'GOOD';
    case 'GOOD': return 'HARD';
    case 'HARD': return 'AGAIN';
    case 'AGAIN': return 'AGAIN';
  }
}

/**
 * Calculate the next interval from stability and retention target.
 * Formula: interval = S * ln(R) / ln(0.9)
 * For R = 0.9, this simplifies to interval ≈ S
 */
function calculateInterval(stability: number): number {
  // ln(RETENTION_TARGET) / ln(0.9) gives us the scaling factor
  // For R = 0.9: ln(0.9) / ln(0.9) = 1, so interval = S
  // For R = 0.85: ln(0.85) / ln(0.9) ≈ 1.54, so interval = S * 1.54
  const factor = Math.log(RETENTION_TARGET) / Math.log(0.9);
  return stability * factor;
}

/**
 * Calculate stability growth factor based on difficulty.
 * Lower difficulty = more stability growth on success.
 */
function getStabilityGrowthFactor(difficulty: number): number {
  // Difficulty 1 → factor ~2.5, Difficulty 10 → factor ~1.1
  return STABILITY_GROWTH_BASE - (difficulty - 1) * 0.1;
}

/**
 * Get initial difficulty based on first confidence rating.
 * Higher confidence → lower difficulty.
 * Uses DEFAULT_DIFFICULTY as the midpoint (grade 3).
 */
function getInitialDifficulty(grade: number): number {
  // Grade 3 → DEFAULT_DIFFICULTY, Grade 0 → D+3, Grade 5 → D-2
  const difficulty = DEFAULT_DIFFICULTY + (3 - grade);
  return clamp(difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

/**
 * Get initial stability based on first confidence rating.
 * Higher confidence → higher initial stability.
 * Uses DEFAULT_STABILITY as the base (grade 3-4).
 */
function getInitialStability(grade: number): number {
  // Scale around DEFAULT_STABILITY based on grade
  if (grade <= 1) return DEFAULT_STABILITY * 0.5;
  if (grade === 2) return DEFAULT_STABILITY * 0.75;
  if (grade <= 4) return DEFAULT_STABILITY;
  return DEFAULT_STABILITY * 2.0;
}

// ============================================
// CORE SCHEDULING FUNCTIONS
// ============================================

/**
 * Calculate the next review state based on current state and grade.
 *
 * @param current - Current review state
 * @param grade - User's confidence grade (0-5)
 * @param tookTooLong - If true, downgrades the rating by one level
 * @returns New review state
 */
export function calculateNextReview(
  current: ReviewState,
  grade: number,
  tookTooLong: boolean = false
): SchedulingResult {
  const now = new Date();

  // Validate and sanitize grade
  const safeGrade = clamp(Math.round(grade), 0, 5);

  // Map grade to FSRS rating, applying tookTooLong penalty
  let rating = gradeToRating(safeGrade);
  if (tookTooLong) {
    rating = downgradeRating(rating);
  }

  // Track if this is a failure (Again rating)
  const isFailure = rating === 'AGAIN';

  // Update lapses count
  const newLapses = isFailure ? current.lapses + 1 : current.lapses;

  // Update difficulty based on rating
  const difficultyDelta = DIFFICULTY_DELTAS[rating];
  const newDifficulty = clamp(
    current.difficulty + difficultyDelta,
    MIN_DIFFICULTY,
    MAX_DIFFICULTY
  );

  // Update stability based on rating
  let newStability: number;
  if (isFailure) {
    // On failure: sharp stability decrease
    newStability = current.stability * STABILITY_MULTIPLIERS.AGAIN;
  } else {
    // On success: stability grows based on difficulty and rating
    const growthFactor = getStabilityGrowthFactor(current.difficulty);
    const ratingMultiplier = STABILITY_MULTIPLIERS[rating];
    newStability = current.stability * growthFactor * ratingMultiplier;
  }
  newStability = clamp(newStability, MIN_STABILITY, MAX_STABILITY);

  // Calculate next interval from new stability
  const intervalDays = calculateInterval(newStability);

  // Update reps (reset on failure, increment on success)
  const newReps = isFailure ? 0 : current.reps + 1;

  return {
    reps: newReps,
    lapses: newLapses,
    interval_days: Math.round(intervalDays * 10) / 10, // Round to 1 decimal
    difficulty: Math.round(newDifficulty * 100) / 100, // Round to 2 decimals
    stability: Math.round(newStability * 100) / 100,   // Round to 2 decimals
    due_at: addDays(now, Math.ceil(intervalDays)),
    last_review_at: now,
    last_grade: safeGrade,
  };
}

/**
 * Create initial review state for a new problem.
 *
 * @param initialGrade - User's initial confidence (0-5)
 * @returns Initial review state
 */
export function createInitialReviewState(initialGrade: number): SchedulingResult {
  const now = new Date();
  const safeGrade = clamp(Math.round(initialGrade), 0, 5);

  // Initialize difficulty and stability based on initial confidence
  const difficulty = getInitialDifficulty(safeGrade);
  const stability = getInitialStability(safeGrade);

  // First review is always tomorrow for new problems
  return {
    reps: 0,
    lapses: 0,
    interval_days: 1,
    difficulty: Math.round(difficulty * 100) / 100,
    stability: Math.round(stability * 100) / 100,
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
