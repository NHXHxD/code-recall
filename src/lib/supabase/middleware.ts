import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Get Supabase URL - checks multiple possible env var names
 */
function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 
         process.env.SUPABASE_URL ||
         process.env.POSTGRES_SUPABASE_URL;
}

/**
 * Get Supabase Anon Key - checks multiple possible env var names
 */
function getSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
         process.env.SUPABASE_ANON_KEY;
}

/**
 * Update session and handle auth redirects
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  // If Supabase is not configured, allow the request through
  // This prevents crashes during initial setup
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured');
    
    // Redirect to a setup page or allow through to login
    if (request.nextUrl.pathname === '/login' || 
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/_next')) {
      return NextResponse.next();
    }
    
    // For other routes, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT REMOVE
  // Refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  const isProtectedRoute = !request.nextUrl.pathname.startsWith('/login') &&
                          !request.nextUrl.pathname.startsWith('/auth') &&
                          !request.nextUrl.pathname.startsWith('/_next') &&
                          !request.nextUrl.pathname.startsWith('/api') &&
                          request.nextUrl.pathname !== '/';

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login page
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
