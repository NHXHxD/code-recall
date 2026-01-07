'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProblem, deleteProblem, toggleSuspend } from '@/lib/actions/problems';
import type { Difficulty } from '@/types/database';

interface ProblemEditFormProps {
  problemId: string;
  initialTitle: string;
  initialDifficulty: Difficulty;
  initialTopics: string[];
  initialUrl: string | null;
  initialSuspended: boolean;
  onCancel: () => void;
  onSaved?: () => void;
}

export function ProblemEditForm({
  problemId,
  initialTitle,
  initialDifficulty,
  initialTopics,
  initialUrl,
  initialSuspended,
  onCancel,
  onSaved,
}: ProblemEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [title, setTitle] = useState(initialTitle);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [url, setUrl] = useState(initialUrl || '');
  const [newTopic, setNewTopic] = useState('');
  const [suspended, setSuspended] = useState(initialSuspended);
  
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddTopic = () => {
    const trimmed = newTopic.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const handleSave = () => {
    setError(null);
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    startTransition(async () => {
      const result = await updateProblem(problemId, {
        title: title.trim(),
        difficulty,
        topics,
        url: url.trim() || null,
      });

      if (result.success) {
        // Also update suspend status if changed
        if (suspended !== initialSuspended) {
          await toggleSuspend(problemId, suspended);
        }
        onSaved?.();
        router.refresh();
      } else {
        setError(result.error || 'Failed to save changes');
      }
    });
  };

  const handleToggleSuspend = () => {
    const newSuspended = !suspended;
    setSuspended(newSuspended);
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProblem(problemId);
      if (result.success) {
        router.push('/problems');
        router.refresh();
      } else {
        setError(result.error || 'Failed to delete problem');
        setShowDeleteConfirm(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
          placeholder="Problem title"
        />
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Difficulty
        </label>
        <div className="flex gap-3">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                difficulty === d
                  ? d === 'Easy'
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : d === 'Medium'
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:border-slate-500'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Topics
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-300"
            >
              {topic}
              <button
                type="button"
                onClick={() => handleRemoveTopic(topic)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
            placeholder="Add a topic..."
          />
          <button
            type="button"
            onClick={handleAddTopic}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 hover:border-emerald-500/50 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          LeetCode URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
          placeholder="https://leetcode.com/problems/..."
        />
      </div>

      {/* Suspend Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
        <div>
          <p className="text-sm font-medium text-slate-300">Pause Reviews</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporarily stop this problem from appearing in review queue
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleSuspend}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            suspended ? 'bg-amber-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              suspended ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Delete Problem
        </button>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Problem?</h3>
            <p className="text-slate-400 mb-6">
              This will permanently delete &quot;{title}&quot; and all its review history. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

