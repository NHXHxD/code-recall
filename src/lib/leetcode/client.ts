/**
 * LeetCode GraphQL Client
 * Fetches problem metadata from LeetCode's public GraphQL API
 */

import type { 
  LeetCodeGraphQLResponse, 
  LeetCodeProblemMetadata,
  LeetCodeErrorCode 
} from '@/types/leetcode';
import type { Difficulty } from '@/types/database';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const REQUEST_TIMEOUT_MS = 8000;

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      difficulty
      topicTags {
        name
        slug
      }
    }
  }
`;

export class LeetCodeClientError extends Error {
  constructor(
    message: string,
    public readonly code: LeetCodeErrorCode,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'LeetCodeClientError';
  }
}

/**
 * Validate slug format before making request
 */
export function validateSlug(slug: string): boolean {
  if (!slug || slug.length > 100) return false;
  // Lowercase letters, numbers, and hyphens only
  // Must not start or end with hyphen
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

/**
 * Normalize LeetCode difficulty to internal Difficulty type
 */
function normalizeDifficulty(difficulty: string): Difficulty {
  const normalized = difficulty as Difficulty;
  if (['Easy', 'Medium', 'Hard'].includes(normalized)) {
    return normalized;
  }
  // Fallback - shouldn't happen with valid LeetCode data
  return 'Medium';
}

/**
 * Fetch problem metadata from LeetCode GraphQL API
 */
export async function fetchLeetCodeProblem(
  slug: string
): Promise<LeetCodeProblemMetadata> {
  if (!validateSlug(slug)) {
    throw new LeetCodeClientError(
      'Invalid slug format',
      'INVALID_SLUG',
      400
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: QUESTION_QUERY,
        variables: { titleSlug: slug },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new LeetCodeClientError(
        `LeetCode API returned ${response.status}`,
        'LEETCODE_ERROR',
        502
      );
    }

    const json: LeetCodeGraphQLResponse = await response.json();

    // Handle GraphQL errors
    if (json.errors && json.errors.length > 0) {
      throw new LeetCodeClientError(
        json.errors[0].message,
        'LEETCODE_ERROR',
        502
      );
    }

    // Handle missing data
    if (!json.data?.question) {
      throw new LeetCodeClientError(
        'Problem not found',
        'PROBLEM_NOT_FOUND',
        404
      );
    }

    const question = json.data.question;

    // Normalize and return
    return {
      leetcodeId: question.questionId,
      slug,
      title: question.title,
      difficulty: normalizeDifficulty(question.difficulty),
      topics: question.topicTags?.map(tag => tag.name) ?? [],
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof LeetCodeClientError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new LeetCodeClientError(
          'Request timed out',
          'TIMEOUT',
          504
        );
      }

      // Network errors
      throw new LeetCodeClientError(
        `Failed to fetch from LeetCode: ${error.message}`,
        'LEETCODE_ERROR',
        502
      );
    }

    throw new LeetCodeClientError(
      'Unknown error occurred',
      'LEETCODE_ERROR',
      502
    );
  }
}

/**
 * Extract slug from various LeetCode URL formats
 */
export function extractSlugFromUrl(url: string): string | null {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/problems\/([a-z0-9-]+)/i
  );
  return match ? match[1].toLowerCase() : null;
}

