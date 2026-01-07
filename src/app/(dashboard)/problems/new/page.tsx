'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProblem } from '@/lib/actions/problems';
import { GRADE_LABELS } from '@/lib/scheduling/sm2';
import type { Difficulty } from '@/types/database';

const COMMON_TOPICS = [
  'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
  'Sorting', 'Greedy', 'Binary Search', 'Tree', 'Graph',
  'Two Pointers', 'Sliding Window', 'Stack', 'Heap', 'Linked List',
  'Recursion', 'Backtracking', 'BFS', 'DFS', 'Bit Manipulation',
];

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

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // Try to extract problem name from URL
    const match = newUrl.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
    if (match && !title) {
      // Convert slug to title case
      const slug = match[1];
      const titleFromSlug = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setTitle(titleFromSlug);
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
        leetcode_id: extractLeetCodeId(url),
        initial_confidence: initialConfidence,
      });

      if (result.success && result.problemId) {
        router.push(`/problems/${result.problemId}`);
      } else {
        setError(result.error || 'Failed to create problem');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white">Add New Problem</h1>
        <p className="mt-1 text-slate-400">Track a LeetCode problem for spaced repetition</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LeetCode URL */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            LeetCode URL (optional)
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://leetcode.com/problems/two-sum/"
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
          <p className="mt-2 text-xs text-slate-500">
            Paste a LeetCode URL to auto-fill the title
          </p>
        </div>

        {/* Title */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Problem Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Two Sum"
            required
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
        </div>

        {/* Difficulty */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`py-3 px-4 rounded-lg border transition-all font-medium ${
                  difficulty === d
                    ? getDifficultyStyle(d)
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/30 text-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Topics / Tags
          </label>
          
          {/* Selected Topics */}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className="hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Common Topics */}
          <div className="flex flex-wrap gap-2 mb-4">
            {COMMON_TOPICS.filter(t => !topics.includes(t)).slice(0, 12).map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className="px-3 py-1 rounded-lg border border-slate-600 hover:border-slate-500 bg-slate-700/30 text-slate-400 hover:text-white text-sm transition-colors"
              >
                + {topic}
              </button>
            ))}
          </div>

          {/* Custom Topic Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
              placeholder="Add custom topic..."
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm"
            />
            <button
              type="button"
              onClick={addCustomTopic}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm"
            >
              Add
            </button>
          </div>
        </div>

        {/* Initial Confidence */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Initial Confidence
          </label>
          <p className="text-xs text-slate-500 mb-4">
            How confident are you with this problem right now?
          </p>
          
          <div className="grid grid-cols-6 gap-2 mb-3">
            {[0, 1, 2, 3, 4, 5].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setInitialConfidence(g)}
                className={`p-3 rounded-lg border transition-all ${
                  initialConfidence === g
                    ? getGradeSelectedStyle(g)
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                }`}
              >
                <span className={`text-lg font-bold ${initialConfidence === g ? 'text-white' : getGradeTextColor(g)}`}>
                  {g}
                </span>
              </button>
            ))}
          </div>
          
          <p className="text-sm text-slate-400">
            <span className={getGradeTextColor(initialConfidence)}>
              {GRADE_LABELS[initialConfidence]?.label}
            </span>
            {' – '}
            {GRADE_LABELS[initialConfidence]?.description}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-medium py-4 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Adding Problem...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Problem
            </>
          )}
        </button>

        <p className="text-center text-sm text-slate-500">
          A notes template will be auto-created for this problem
        </p>
      </form>
    </div>
  );
}

function extractLeetCodeId(url: string): string | undefined {
  const match = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  return match ? match[1] : undefined;
}

function getDifficultyStyle(difficulty: Difficulty): string {
  const styles = {
    Easy: 'border-green-500 bg-green-500/20 text-green-400',
    Medium: 'border-yellow-500 bg-yellow-500/20 text-yellow-400',
    Hard: 'border-red-500 bg-red-500/20 text-red-400',
  };
  return styles[difficulty];
}

function getGradeTextColor(grade: number): string {
  const colors: Record<number, string> = {
    0: 'text-red-400',
    1: 'text-orange-400',
    2: 'text-yellow-400',
    3: 'text-lime-400',
    4: 'text-green-400',
    5: 'text-emerald-400',
  };
  return colors[grade] || 'text-slate-400';
}

function getGradeSelectedStyle(grade: number): string {
  const styles: Record<number, string> = {
    0: 'border-red-500 bg-red-500/20',
    1: 'border-orange-500 bg-orange-500/20',
    2: 'border-yellow-500 bg-yellow-500/20',
    3: 'border-lime-500 bg-lime-500/20',
    4: 'border-green-500 bg-green-500/20',
    5: 'border-emerald-500 bg-emerald-500/20',
  };
  return styles[grade] || 'border-slate-500 bg-slate-500/20';
}

