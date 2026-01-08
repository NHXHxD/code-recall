'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Loader2, Check, AlertTriangle, Zap, X } from 'lucide-react';
import { createProblem } from '@/lib/actions/problems';
import { GRADE_LABELS } from '@/lib/scheduling/sm2';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@/types/database';
import type { FetchLeetCodeResponse, LeetCodeProblemMetadata } from '@/types/leetcode';

const COMMON_TOPICS = [
  'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
  'Sorting', 'Greedy', 'Binary Search', 'Tree', 'Graph',
  'Two Pointers', 'Sliding Window', 'Stack', 'Heap', 'Linked List',
  'Recursion', 'Backtracking', 'BFS', 'DFS', 'Bit Manipulation',
];

type FetchStatus = 'idle' | 'fetching' | 'success' | 'error';

export default function AddProblemPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [initialConfidence, setInitialConfidence] = useState(3);
  const [notesContent, setNotesContent] = useState('');
  const [keyIdea, setKeyIdea] = useState('');

  // Auto-fetch state
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const lastFetchedSlug = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Extract slug from LeetCode URL
   */
  const extractSlug = (urlStr: string): string | null => {
    const match = urlStr.match(
      /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/problems\/([a-z0-9-]+)/i
    );
    return match ? match[1].toLowerCase() : null;
  };

  /**
   * Fetch problem metadata from LeetCode
   */
  const fetchProblemMetadata = useCallback(async (slug: string) => {
    // Skip if already fetched this slug
    if (slug === lastFetchedSlug.current) return;
    
    setFetchStatus('fetching');
    setFetchError(null);
    lastFetchedSlug.current = slug;

    try {
      const response = await fetch('/api/leetcode/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      const result: FetchLeetCodeResponse = await response.json();

      if (result.success) {
        applyMetadata(result.data);
        setFetchStatus('success');
        setAutoFilled(true);
      } else {
        setFetchStatus('error');
        setFetchError(result.error.message);
        // Don't clear lastFetchedSlug so user can retry
        lastFetchedSlug.current = null;
      }
    } catch {
      setFetchStatus('error');
      setFetchError('Failed to connect to server');
      lastFetchedSlug.current = null;
    }
  }, []);

  /**
   * Apply fetched metadata to form
   */
  const applyMetadata = (data: LeetCodeProblemMetadata) => {
    setTitle(data.title);
    setDifficulty(data.difficulty);
    setTopics(data.topics);
  };

  /**
   * Handle URL input changes with debounced auto-fetch
   */
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setError(null);

    // Clear any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const slug = extractSlug(newUrl);
    
    if (!slug) {
      // Not a valid LeetCode URL, reset fetch state
      if (fetchStatus !== 'idle') {
        setFetchStatus('idle');
        setFetchError(null);
      }
      return;
    }

    // Debounce the fetch (300ms)
    debounceTimer.current = setTimeout(() => {
      fetchProblemMetadata(slug);
    }, 300);
  };

  /**
   * Handle paste event for immediate fetch
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const slug = extractSlug(pastedText);
    
    if (slug) {
      // Clear debounce and fetch immediately
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Small delay to let the input update
      setTimeout(() => fetchProblemMetadata(slug), 50);
    }
  };

  /**
   * Manual retry button
   */
  const handleRetryFetch = () => {
    const slug = extractSlug(url);
    if (slug) {
      lastFetchedSlug.current = null;
      fetchProblemMetadata(slug);
    }
  };

  const toggleTopic = (topic: string) => {
    setTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const addCustomTopic = () => {
    if (customTopic.trim() && !topics.includes(customTopic.trim())) {
      setTopics(prev => [...prev, customTopic.trim()]);
      setCustomTopic('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createProblem({
        title: title.trim(),
        difficulty,
        topics,
        url: url.trim() || undefined,
        leetcode_id: extractSlug(url) || undefined,
        initial_confidence: initialConfidence,
        notes_content: notesContent.trim() || undefined,
        key_idea: keyIdea.trim() || undefined,
      });

      if (result.success && result.problemId) {
        router.push(`/problems/${result.problemId}`);
      } else {
        setError(result.error || 'Failed to create problem');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4 gap-2 text-[var(--foreground-muted)]">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Add New Problem</h1>
        <p className="mt-1 text-[var(--foreground-muted)]">Track a LeetCode problem for spaced repetition</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LeetCode URL */}
        <Card className="border-[var(--border)]">
          <CardContent className="pt-6">
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              LeetCode URL
            </label>
            <div className="relative">
              <Input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onPaste={handlePaste}
                placeholder="https://leetcode.com/problems/two-sum/"
                className="pr-12"
              />
              {/* Status indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {fetchStatus === 'fetching' && (
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
                )}
                {fetchStatus === 'success' && (
                  <Check className="h-5 w-5 text-[var(--accent)]" />
                )}
                {fetchStatus === 'error' && (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
              </div>
            </div>
            
            {/* Fetch status messages */}
            {fetchStatus === 'success' && autoFilled && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--accent)]">
                <Zap className="h-3.5 w-3.5" />
                Auto-filled from LeetCode
              </div>
            )}
            
            {fetchStatus === 'error' && fetchError && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {fetchError}. You can enter details manually.
                </span>
                <button
                  type="button"
                  onClick={handleRetryFetch}
                  className="text-xs text-[var(--foreground-muted)] underline hover:text-[var(--foreground)]"
                >
                  Retry
                </button>
              </div>
            )}
            
            {fetchStatus === 'idle' && (
              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                Paste a LeetCode URL to auto-fill problem details
              </p>
            )}
          </CardContent>
        </Card>

        {/* Title */}
        <Card className="border-[var(--border)]">
          <CardContent className="pt-6">
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Problem Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Two Sum"
              required
            />
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card className="border-[var(--border)]">
          <CardContent className="pt-6">
            <label className="mb-3 block text-sm font-medium text-[var(--foreground)]">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "rounded-lg border py-3 px-4 font-medium transition-all",
                    difficulty === d
                      ? getDifficultyStyle(d)
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Topics */}
        <Card className="border-[var(--border)]">
          <CardContent className="pt-6">
            <label className="mb-3 block text-sm font-medium text-[var(--foreground)]">
              Topics / Tags
            </label>
            
            {/* Selected Topics */}
            {topics.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="success"
                    className="gap-1 pr-1.5"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className="rounded-full p-0.5 hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Common Topics */}
            <div className="mb-4 flex flex-wrap gap-2">
              {COMMON_TOPICS.filter(t => !topics.includes(t)).slice(0, 12).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--foreground-muted)] transition-colors hover:border-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
                >
                  + {topic}
                </button>
              ))}
            </div>

            {/* Custom Topic Input */}
            <div className="flex gap-2">
              <Input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
                placeholder="Add custom topic..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomTopic}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Initial Confidence */}
        <Card className="border-[var(--border)]">
          <CardContent className="pt-6">
            <label className="mb-3 block text-sm font-medium text-[var(--foreground)]">
              Initial Confidence
            </label>
            <p className="mb-4 text-xs text-[var(--foreground-muted)]">
              How confident are you with this problem right now?
            </p>
            
            <div className="mb-3 grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setInitialConfidence(g)}
                  className={cn(
                    "rounded-lg border p-3 transition-all",
                    initialConfidence === g
                      ? getGradeSelectedStyle(g)
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--foreground-subtle)]'
                  )}
                >
                  <span className={cn(
                    "text-lg font-bold",
                    initialConfidence === g ? 'text-[var(--foreground)]' : getGradeTextColor(g)
                  )}>
                    {g}
                  </span>
                </button>
              ))}
            </div>
            
            <p className="text-sm text-[var(--foreground-muted)]">
              <span className={getGradeTextColor(initialConfidence)}>
                {GRADE_LABELS[initialConfidence]?.label}
              </span>
              {' – '}
              {GRADE_LABELS[initialConfidence]?.description}
            </p>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="border-[var(--border)]">
          <CardContent className="pt-6">
            <label className="mb-3 block text-sm font-medium text-[var(--foreground)]">
              Notes <span className="font-normal text-[var(--foreground-muted)]">(optional)</span>
            </label>
            <p className="mb-4 text-xs text-[var(--foreground-muted)]">
              Add your notes now or leave blank to use the default template
            </p>

            {/* Key Idea */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-[var(--foreground-muted)]">
                Key Idea
              </label>
              <Input
                type="text"
                value={keyIdea}
                onChange={(e) => setKeyIdea(e.target.value)}
                placeholder="One-line summary of the key insight..."
              />
            </div>

            {/* Notes Content */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--foreground-muted)]">
                Content
              </label>
              <Textarea
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                rows={10}
                placeholder={`## Core Pattern\n\n## Trigger\n\n## Invariant / Key Idea\n\n## One-liner Plan\n\n## Common Traps\n\n## Complexity\n\n## Similar Problems`}
                className="resize-y font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <X className="h-5 w-5 text-red-500" />
            <span className="text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting || fetchStatus === 'fetching'}
          className="w-full gap-2 py-6 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Adding Problem...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Add Problem
            </>
          )}
        </Button>

        <p className="text-center text-sm text-[var(--foreground-muted)]">
          {notesContent.trim() ? 'Your notes will be saved with this problem' : 'A notes template will be auto-created for this problem'}
        </p>
      </form>
    </div>
  );
}

function getDifficultyStyle(difficulty: Difficulty): string {
  const styles = {
    Easy: 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400',
    Medium: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    Hard: 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400',
  };
  return styles[difficulty];
}

function getGradeTextColor(grade: number): string {
  const colors: Record<number, string> = {
    0: 'text-red-500 dark:text-red-400',
    1: 'text-orange-500 dark:text-orange-400',
    2: 'text-yellow-500 dark:text-yellow-400',
    3: 'text-lime-500 dark:text-lime-400',
    4: 'text-green-500 dark:text-green-400',
    5: 'text-emerald-500 dark:text-emerald-400',
  };
  return colors[grade] || 'text-[var(--foreground-muted)]';
}

function getGradeSelectedStyle(grade: number): string {
  const styles: Record<number, string> = {
    0: 'border-red-500/50 bg-red-500/10',
    1: 'border-orange-500/50 bg-orange-500/10',
    2: 'border-yellow-500/50 bg-yellow-500/10',
    3: 'border-lime-500/50 bg-lime-500/10',
    4: 'border-green-500/50 bg-green-500/10',
    5: 'border-emerald-500/50 bg-emerald-500/10',
  };
  return styles[grade] || 'border-[var(--border)] bg-[var(--muted)]';
}
