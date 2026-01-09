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
 * Uses two-step query to ensure reliable filtering on review_state
 */
export async function getDueToday(): Promise<ProblemWithDetails[]> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const now = new Date();
    const endOfToday = endOfDay(now);
    
    // Step 1: Get due problem IDs from review_state directly (reliable filtering)
    const { data: dueStates, error: stateError } = await supabase
      .from('review_state')
      .select('problem_id, due_at')
      .eq('user_id', user.id)
      .eq('suspended', false)
      .lte('due_at', endOfToday.toISOString())
      .order('due_at', { ascending: true });
    
    if (stateError) throw stateError;
    if (!dueStates || dueStates.length === 0) return [];
    
    const problemIds = dueStates.map(s => s.problem_id);
    
    // Step 2: Fetch full problem details for those IDs
    const { data, error } = await supabase
      .from('problems')
      .select(`
        *,
        review_state (*),
        notes (*)
      `)
      .eq('user_id', user.id)
      .in('id', problemIds);
    
    if (error) throw error;
    
    // Map the data and sort by due_at (preserve order from first query)
    const problemsMap = new Map(
      (data || []).map(p => [
        p.id,
        {
          ...p,
          review_state: p.review_state?.[0] || p.review_state,
          notes: p.notes?.[0] || p.notes,
        } as ProblemWithDetails
      ])
    );
    
    // Return in due_at order (using the order from dueStates)
    return dueStates
      .map(s => problemsMap.get(s.problem_id))
      .filter((p): p is ProblemWithDetails => p !== undefined);
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
 * "Today" includes all overdue problems (due_at <= end of today)
 * Future days only count problems specifically due on those days
 */
export async function getUpcomingReviews(): Promise<UpcomingReview[]> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const now = new Date();
    const todayEnd = endOfDay(now);
    const weekEnd = endOfDay(addDays(now, 6));
    
    // Fetch all reviews due up to end of week (including overdue)
    const { data, error } = await supabase
      .from('review_state')
      .select('due_at')
      .eq('user_id', user.id)
      .eq('suspended', false)
      .lte('due_at', weekEnd.toISOString());
    
    if (error) throw error;
    
    // Count for today (includes all overdue + due today)
    let todayCount = 0;
    // Count for future days (only problems due on those specific days)
    const futureCounts = new Map<string, number>();
    
    // Initialize future days with 0
    for (let i = 1; i < 7; i++) {
      const dayKey = format(startOfDay(addDays(now, i)), 'yyyy-MM-dd');
      futureCounts.set(dayKey, 0);
    }
    
    // Categorize reviews
    for (const item of data || []) {
      const dueDate = new Date(item.due_at);
      
      if (dueDate <= todayEnd) {
        // Due today or overdue - count towards "Today"
        todayCount++;
      } else {
        // Future - count towards specific day
        const dayKey = format(startOfDay(dueDate), 'yyyy-MM-dd');
        if (futureCounts.has(dayKey)) {
          futureCounts.set(dayKey, (futureCounts.get(dayKey) || 0) + 1);
        }
      }
    }
    
    // Build result array
    const days: UpcomingReview[] = [
      { date: format(startOfDay(now), 'EEE, MMM d'), count: todayCount }
    ];
    
    for (let i = 1; i < 7; i++) {
      const dayStart = startOfDay(addDays(now, i));
      const dayKey = format(dayStart, 'yyyy-MM-dd');
      days.push({
        date: format(dayStart, 'EEE, MMM d'),
        count: futureCounts.get(dayKey) || 0,
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

