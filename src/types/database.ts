/**
 * Database types for Code Recall
 * These types mirror the PostgreSQL schema
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Outcome = 'solved' | 'partial' | 'failed';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Problem {
  id: string;
  user_id: string;
  leetcode_id: string | null;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  url: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  problem_id: string;
  user_id: string;
  content: string;
  key_idea: string | null;
  updated_at: string;
}

export interface ReviewState {
  problem_id: string;
  user_id: string;
  due_at: string;
  interval_days: number;
  difficulty: number;  // FSRS difficulty (1-10 scale, lower = easier)
  stability: number;   // FSRS stability in days
  reps: number;
  lapses: number;      // Count of "Again" ratings (failures)
  last_review_at: string | null;
  last_grade: number | null;
  suspended: boolean;
}

export interface ReviewLog {
  id: string;
  problem_id: string;
  user_id: string;
  reviewed_at: string;
  grade: number;
  time_spent: number | null;
  outcome: Outcome | null;
  reflection: string | null;
}

// Extended types with joins
export interface ProblemWithReviewState extends Problem {
  review_state: ReviewState | null;
  notes: Note | null;
}

export interface ProblemWithDetails extends Problem {
  review_state: ReviewState;
  notes: Note | null;
  review_logs?: ReviewLog[];
}

// Input types for creating/updating
export interface CreateProblemInput {
  leetcode_id?: string;
  title: string;
  difficulty: Difficulty;
  topics?: string[];
  url?: string;
  initial_confidence: number;
  notes_content?: string;
  key_idea?: string;
}

export interface LogReviewInput {
  problem_id: string;
  grade: number;
  outcome?: Outcome;
  reflection?: string;
  time_spent?: number;
}

// Dashboard stats
export interface DashboardStats {
  due_today: number;
  due_this_week: number;
  total_problems: number;
  reviews_today: number;
}

export interface UpcomingReview {
  date: string;
  count: number;
}

