'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import { createInitialReviewState } from '@/lib/scheduling/sm2';
import type { CreateProblemInput, Problem, ProblemWithDetails, ProblemWithReviewState } from '@/types/database';

/**
 * Default notes template for new problems
 */
const NOTES_TEMPLATE = `## Core Pattern

## Trigger

## Invariant / Key Idea

## One-liner Plan

## Common Traps

## Complexity

## Similar Problems
`;

/**
 * Create a new problem with initial review state and notes
 */
export async function createProblem(input: CreateProblemInput): Promise<{ success: boolean; problemId?: string; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    // Calculate initial review state
    const initialState = createInitialReviewState(input.initial_confidence);
    
    // Insert problem
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .insert({
        user_id: user.id,
        leetcode_id: input.leetcode_id || null,
        title: input.title,
        difficulty: input.difficulty,
        topics: input.topics || [],
        url: input.url || null,
      })
      .select()
      .single();
    
    if (problemError) throw problemError;
    
    // Insert review state with FSRS parameters
    const { error: stateError } = await supabase
      .from('review_state')
      .insert({
        problem_id: problem.id,
        user_id: user.id,
        due_at: initialState.due_at.toISOString(),
        interval_days: initialState.interval_days,
        difficulty: initialState.difficulty,
        stability: initialState.stability,
        reps: initialState.reps,
        lapses: initialState.lapses,
        last_review_at: initialState.last_review_at.toISOString(),
        last_grade: initialState.last_grade,
        suspended: false,
      });
    
    if (stateError) throw stateError;
    
    // Insert notes with template
    const notesContent = input.notes_content || NOTES_TEMPLATE;
    const { error: notesError } = await supabase
      .from('notes')
      .insert({
        problem_id: problem.id,
        user_id: user.id,
        content: notesContent,
        key_idea: input.key_idea || null,
      });
    
    if (notesError) throw notesError;
    
    revalidatePath('/dashboard');
    revalidatePath('/review');
    revalidatePath('/problems');
    
    return { success: true, problemId: problem.id };
  } catch (error) {
    console.error('Error creating problem:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create problem' };
  }
}

/**
 * Get a single problem with all details
 */
export async function getProblem(problemId: string): Promise<ProblemWithDetails | null> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const { data: problem, error } = await supabase
      .from('problems')
      .select(`
        *,
        review_state (*),
        notes (*)
      `)
      .eq('id', problemId)
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    
    return {
      ...problem,
      review_state: problem.review_state?.[0] || problem.review_state,
      notes: problem.notes?.[0] || problem.notes,
    } as ProblemWithDetails;
  } catch (error) {
    console.error('Error fetching problem:', error);
    return null;
  }
}

/**
 * Get all problems for the current user with review state
 */
export async function getProblems(): Promise<ProblemWithReviewState[]> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('problems')
      .select(`
        *,
        review_state (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(p => ({
      ...p,
      review_state: p.review_state?.[0] || p.review_state || null,
      notes: null,
    })) as ProblemWithReviewState[];
  } catch (error) {
    console.error('Error fetching problems:', error);
    return [];
  }
}

/**
 * Update a problem
 */
export async function updateProblem(
  problemId: string,
  updates: Partial<Pick<Problem, 'title' | 'difficulty' | 'topics' | 'url' | 'leetcode_id'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('problems')
      .update(updates)
      .eq('id', problemId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    revalidatePath(`/problems/${problemId}`);
    revalidatePath('/dashboard');
    revalidatePath('/problems');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating problem:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update problem' };
  }
}

/**
 * Delete a problem (cascades to notes, review_state, review_log)
 */
export async function deleteProblem(problemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('problems')
      .delete()
      .eq('id', problemId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    revalidatePath('/dashboard');
    revalidatePath('/review');
    revalidatePath('/problems');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting problem:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete problem' };
  }
}

/**
 * Toggle problem suspension
 */
export async function toggleSuspend(problemId: string, suspended: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('review_state')
      .update({ suspended })
      .eq('problem_id', problemId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    revalidatePath('/dashboard');
    revalidatePath('/review');
    revalidatePath('/problems');
    revalidatePath(`/problems/${problemId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error toggling suspend:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to toggle suspend' };
  }
}

