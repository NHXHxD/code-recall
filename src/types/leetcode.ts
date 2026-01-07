/**
 * LeetCode API types for Code Recall
 * Types for interacting with LeetCode's public GraphQL API
 */

import type { Difficulty } from './database';

// ============================================
// GraphQL Response Types (raw from LeetCode)
// ============================================

export interface LeetCodeTopicTag {
  name: string;
  slug: string;
}

export interface LeetCodeQuestion {
  questionId: string;
  title: string;
  difficulty: string;
  topicTags: LeetCodeTopicTag[];
}

export interface LeetCodeGraphQLResponse {
  data: {
    question: LeetCodeQuestion | null;
  } | null;
  errors?: Array<{
    message: string;
  }>;
}

// ============================================
// Normalized Internal Types
// ============================================

export interface LeetCodeProblemMetadata {
  leetcodeId: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
}

// ============================================
// API Request/Response Types
// ============================================

export interface FetchLeetCodeRequest {
  slug: string;
}

export interface FetchLeetCodeSuccessResponse {
  success: true;
  data: LeetCodeProblemMetadata;
  cached: boolean;
}

export interface FetchLeetCodeErrorResponse {
  success: false;
  error: {
    code: LeetCodeErrorCode;
    message: string;
  };
}

export type FetchLeetCodeResponse = 
  | FetchLeetCodeSuccessResponse 
  | FetchLeetCodeErrorResponse;

// ============================================
// Error Codes
// ============================================

export type LeetCodeErrorCode =
  | 'INVALID_SLUG'
  | 'UNAUTHORIZED'
  | 'PROBLEM_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'LEETCODE_ERROR'
  | 'TIMEOUT';

// ============================================
// Cache Types
// ============================================

export interface CachedLeetCodeMetadata {
  slug: string;
  leetcode_id: string;
  title: string;
  difficulty: string;
  topics: string[];
  fetched_at: string;
  expires_at: string;
}

