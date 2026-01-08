'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import { calculateNextReview } from '@/lib/scheduling/sm2';
import type { LogReviewInput, ProblemWithDetails, DashboardStats, UpcomingReview } from '@/types/database';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

/**
 * Log a review and update the scheduling state
 * This is the core review loop action
 */
export async function logReview(input: LogReviewInput): Promise<{ success: boolean; nextDue?: string; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    // Get current review state
    const { data: currentState, error: fetchError } = await supabase
      .from('review_state')
      .select('*')
      .eq('problem_id', input.problem_id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Calculate new review state
    const newState = calculateNextReview(
      {
        due_at: new Date(currentState.due_at),
        interval_days: currentState.interval_days,
        ease: currentState.ease,
        reps: currentState.reps,
        last_review_at: currentState.last_review_at ? new Date(currentState.last_review_at) : null,
        last_grade: currentState.last_grade,
      },
      input.grade
    );
    
    // Update review state
    const { error: updateError } = await supabase
      .from('review_state')
      .update({
        due_at: newState.due_at.toISOString(),
        interval_days: newState.interval_days,
        ease: newState.ease,
        reps: newState.reps,
        last_review_at: newState.last_review_at.toISOString(),
        last_grade: newState.last_grade,
      })
      .eq('problem_id', input.problem_id)
      .eq('user_id', user.id);
    
    if (updateError) throw updateError;
    
    // Insert review log
    const { error: logError } = await supabase
      .from('review_log')
      .insert({
        problem_id: input.problem_id,
        user_id: user.id,
        grade: input.grade,
        outcome: input.outcome || null,
        reflection: input.reflection || null,
        time_spent: input.time_spent || null,
      });
    
    if (logError) throw logError;
    
    revalidatePath('/dashboard');
    revalidatePath('/review');
    revalidatePath(`/problems/${input.problem_id}`);
    
    return { 
      success: true, 
      nextDue: format(newState.due_at, 'MMM d, yyyy')
    };
  } catch (error) {
    console.error('Error logging review:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to log review' };
  }
}

/**
 * Get problems due for review today
 */
export async function getDueToday(): Promise<ProblemWithDetails[]> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const now = new Date();
    const endOfToday = endOfDay(now);
    
    const { data, error } = await supabase
      .from('problems')
      .select(`
        *,
        review_state!inner (*),
        notes (*)
      `)
      .eq('user_id', user.id)
      .eq('review_state.suspended', false)
      .lte('review_state.due_at', endOfToday.toISOString())
      .order('review_state(due_at)', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(p => ({
      ...p,
      review_state: p.review_state?.[0] || p.review_state,
      notes: p.notes?.[0] || p.notes,
    })) as ProblemWithDetails[];
  } catch (error) {
    console.error('Error fetching due today:', error);
    return [];
  }
}

/**
 * Get dashboard statistics
 * Optimized: Parallel queries instead of sequential
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = endOfDay(addDays(now, 7));
    
    // Run all count queries in parallel
    const [
      { count: dueToday },
      { count: dueThisWeek },
      { count: totalProblems },
      { count: reviewsToday },
    ] = await Promise.all([
      // Due today count
      supabase
        .from('review_state')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('suspended', false)
        .lte('due_at', todayEnd.toISOString()),
      
      // Due this week count
      supabase
        .from('review_state')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('suspended', false)
        .lte('due_at', weekEnd.toISOString()),
      
      // Total problems count
      supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Reviews completed today
      supabase
        .from('review_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('reviewed_at', todayStart.toISOString())
        .lte('reviewed_at', todayEnd.toISOString()),
    ]);
    
    return {
      due_today: dueToday || 0,
      due_this_week: dueThisWeek || 0,
      total_problems: totalProblems || 0,
      reviews_today: reviewsToday || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      due_today: 0,
      due_this_week: 0,
      total_problems: 0,
      reviews_today: 0,
    };
  }
}

/**
 * Get upcoming reviews for the next 7 days
 * Optimized: Single query with JS grouping instead of 7 separate queries
 */
export async function getUpcomingReviews(): Promise<UpcomingReview[]> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekEnd = endOfDay(addDays(now, 6));
    
    // Single query to fetch all reviews due in the next 7 days
    const { data, error } = await supabase
      .from('review_state')
      .select('due_at')
      .eq('user_id', user.id)
      .eq('suspended', false)
      .gte('due_at', todayStart.toISOString())
      .lte('due_at', weekEnd.toISOString());
    
    if (error) throw error;
    
    // Group by day in JavaScript (fast, in-memory)
    const countsByDay = new Map<string, number>();
    
    // Initialize all 7 days with 0
    for (let i = 0; i < 7; i++) {
      const dayKey = format(startOfDay(addDays(now, i)), 'yyyy-MM-dd');
      countsByDay.set(dayKey, 0);
    }
    
    // Count reviews per day
    for (const item of data || []) {
      const dayKey = format(startOfDay(new Date(item.due_at)), 'yyyy-MM-dd');
      if (countsByDay.has(dayKey)) {
        countsByDay.set(dayKey, (countsByDay.get(dayKey) || 0) + 1);
      }
    }
    
    // Build result array
    const days: UpcomingReview[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = startOfDay(addDays(now, i));
      const dayKey = format(dayStart, 'yyyy-MM-dd');
      days.push({
        date: format(dayStart, 'EEE, MMM d'),
        count: countsByDay.get(dayKey) || 0,
      });
    }
    
    return days;
  } catch (error) {
    console.error('Error fetching upcoming reviews:', error);
    return [];
  }
}

/**
 * Get review history for a problem
 */
export async function getReviewHistory(problemId: string): Promise<{ id: string; reviewed_at: string; grade: number; outcome: string | null }[]> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('review_log')
      .select('id, reviewed_at, grade, outcome')
      .eq('problem_id', problemId)
      .eq('user_id', user.id)
      .order('reviewed_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching review history:', error);
    return [];
  }
}

/**
 * Delete a single review log entry
 */
export async function deleteReviewLog(reviewId: string, problemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('review_log')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    revalidatePath('/dashboard');
    revalidatePath('/review');
    revalidatePath(`/problems/${problemId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting review log:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete review' };
  }
}

