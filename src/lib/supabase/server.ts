import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

/**
 * Get Supabase URL - checks multiple possible env var names
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 
              process.env.SUPABASE_URL ||
              process.env.POSTGRES_SUPABASE_URL;
  
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
 * Create a Supabase client for use in Server Components, Route Handlers, and Server Actions
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 * 
 * Wrapped with React cache() to deduplicate calls within the same request.
 * When multiple server actions call getUser() in parallel (e.g., dashboard page),
 * only one actual auth request is made.
 */
export const getUser = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
});

/**
 * Get the current authenticated user or throw an error
 * Use this in protected routes/actions
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
