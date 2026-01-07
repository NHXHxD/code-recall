/**
 * LeetCode Metadata Cache Operations
 * Handles caching of problem metadata in Supabase
 */

import { createClient } from '@/lib/supabase/server';
import type { LeetCodeProblemMetadata, CachedLeetCodeMetadata } from '@/types/leetcode';
import type { Difficulty } from '@/types/database';

// Cache TTL: 7 days fresh
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Stale fallback: up to 30 days
const STALE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheResult {
  data: LeetCodeProblemMetadata | null;
  isStale: boolean;
}

/**
 * Get cached metadata for a problem slug
 * Returns null if not found or expired beyond stale threshold
 */
export async function getCachedMetadata(slug: string): Promise<CacheResult> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('leetcode_metadata_cache')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return { data: null, isStale: false };
  }

  const cached = data as CachedLeetCodeMetadata;
  const now = new Date();
  const expiresAt = new Date(cached.expires_at);
  const fetchedAt = new Date(cached.fetched_at);
  const staleDeadline = new Date(fetchedAt.getTime() + STALE_TTL_MS);

  // Check if beyond stale threshold (30 days)
  if (now > staleDeadline) {
    return { data: null, isStale: false };
  }

  const metadata: LeetCodeProblemMetadata = {
    leetcodeId: cached.leetcode_id,
    slug: cached.slug,
    title: cached.title,
    difficulty: cached.difficulty as Difficulty,
    topics: cached.topics,
  };

  // Check if stale (past 7-day fresh period)
  const isStale = now > expiresAt;

  return { data: metadata, isStale };
}

/**
 * Store metadata in cache
 */
export async function setCachedMetadata(
  metadata: LeetCodeProblemMetadata
): Promise<void> {
  const supabase = await createClient();
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

  const { error } = await supabase
    .from('leetcode_metadata_cache')
    .upsert({
      slug: metadata.slug,
      leetcode_id: metadata.leetcodeId,
      title: metadata.title,
      difficulty: metadata.difficulty,
      topics: metadata.topics,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: 'slug',
    });

  if (error) {
    // Log but don't fail - caching is best-effort
    console.error('Failed to cache LeetCode metadata:', error);
  }
}

/**
 * Check if a problem with this slug already exists for the user
 */
export async function checkDuplicateProblem(
  userId: string,
  slug: string
): Promise<{ exists: boolean; problemId?: string; title?: string }> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('problems')
    .select('id, title')
    .eq('user_id', userId)
    .eq('leetcode_id', slug)
    .single();

  if (error || !data) {
    return { exists: false };
  }

  return {
    exists: true,
    problemId: data.id,
    title: data.title,
  };
}

