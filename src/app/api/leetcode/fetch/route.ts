/**
 * LeetCode Problem Fetch API Route
 * POST /api/leetcode/fetch
 * 
 * Fetches problem metadata from LeetCode's public GraphQL API
 * with caching and rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { 
  fetchLeetCodeProblem, 
  validateSlug,
  LeetCodeClientError 
} from '@/lib/leetcode/client';
import { getCachedMetadata, setCachedMetadata } from '@/lib/leetcode/cache';
import type { FetchLeetCodeResponse } from '@/types/leetcode';

// ============================================
// Rate Limiting (in-memory, per-user)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(userId);
    }
  }
}, 60 * 1000);

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<FetchLeetCodeResponse>> {
  try {
    // 1. Authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to fetch problem data',
          },
        },
        { status: 401 }
      );
    }

    // 2. Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please wait a moment.',
          },
        },
        { status: 429 }
      );
    }

    // 3. Parse and validate request body
    let body: { slug?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SLUG',
            message: 'Invalid request body',
          },
        },
        { status: 400 }
      );
    }

    const { slug } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SLUG',
            message: 'Slug is required',
          },
        },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.toLowerCase().trim();

    if (!validateSlug(normalizedSlug)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SLUG',
            message: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.',
          },
        },
        { status: 400 }
      );
    }

    // 4. Check cache first
    const { data: cachedData, isStale } = await getCachedMetadata(normalizedSlug);

    if (cachedData && !isStale) {
      // Fresh cache hit
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    // 5. Fetch from LeetCode
    try {
      const metadata = await fetchLeetCodeProblem(normalizedSlug);

      // 6. Store in cache (async, don't await)
      setCachedMetadata(metadata).catch(err => {
        console.error('Cache write failed:', err);
      });

      return NextResponse.json({
        success: true,
        data: metadata,
        cached: false,
      });
    } catch (error) {
      // 7. On LeetCode failure, try to serve stale cache
      if (cachedData) {
        console.warn('Serving stale cache due to LeetCode error:', error);
        return NextResponse.json({
          success: true,
          data: cachedData,
          cached: true,
        });
      }

      // No cache available, return error
      if (error instanceof LeetCodeClientError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
            },
          },
          { status: error.statusCode }
        );
      }

      // Unknown error
      console.error('Unknown error fetching LeetCode problem:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LEETCODE_ERROR',
            message: 'Failed to fetch problem data',
          },
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in LeetCode fetch route:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LEETCODE_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

