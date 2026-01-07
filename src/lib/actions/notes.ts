'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import type { Note } from '@/types/database';

/**
 * Update notes for a problem
 */
export async function updateNotes(
  problemId: string,
  content: string,
  keyIdea?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('notes')
      .update({
        content,
        key_idea: keyIdea || null,
        updated_at: new Date().toISOString(),
      })
      .eq('problem_id', problemId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    revalidatePath(`/problems/${problemId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating notes:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update notes' };
  }
}

/**
 * Get notes for a problem
 */
export async function getNotes(problemId: string): Promise<Note | null> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('problem_id', problemId)
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    return null;
  }
}

