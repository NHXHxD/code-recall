import { createBrowserClient } from '@supabase/ssr';

/**
 * Get Supabase URL - checks multiple possible env var names
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 
              process.env.SUPABASE_URL;
  
  if (!url) {
    throw new Error('Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL in your environment.');
  }
  return url;
}

/**
 * Get Supabase Anon Key - checks multiple possible env var names
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
              process.env.SUPABASE_ANON_KEY;
  
  if (!key) {
    throw new Error('Missing Supabase Anon Key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.');
  }
  return key;
}

/**
 * Create a Supabase client for use in the browser
 * Used in Client Components
 */
export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}
