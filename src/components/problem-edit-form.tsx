'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { updateProblem, deleteProblem, toggleSuspend } from '@/lib/actions/problems';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';
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
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
          Title
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Problem title"
        />
      </div>

      {/* Difficulty */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
          Difficulty
        </label>
        <div className="flex gap-3">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                "rounded-lg border px-4 py-2 transition-colors",
                difficulty === d
                  ? d === 'Easy'
                    ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400'
                    : d === 'Medium'
                    ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    : 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
          Topics
        </label>
        <div className="mb-3 flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Badge
              key={topic}
              variant="secondary"
              className="gap-1.5 pr-1.5"
            >
              {topic}
              <button
                type="button"
                onClick={() => handleRemoveTopic(topic)}
                className="rounded-full p-0.5 transition-colors hover:bg-red-500/20 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a topic..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTopic}
          >
            Add
          </Button>
        </div>
      </div>

      {/* URL */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
          LeetCode URL
        </label>
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://leetcode.com/problems/..."
        />
      </div>

      {/* Suspend Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">Pause Reviews</p>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
            Temporarily stop this problem from appearing in review queue
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleSuspend}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            suspended ? 'bg-amber-500' : 'bg-[var(--border)]'
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              suspended ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
        >
          Delete Problem
        </Button>
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            loading={isPending}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="mx-4 w-full max-w-md border-[var(--border)]">
            <CardContent className="pt-6">
              <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Delete Problem?</h3>
              <p className="mb-6 text-[var(--foreground-muted)]">
                This will permanently delete &quot;{title}&quot; and all its review history. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  loading={isPending}
                  loadingText="Deleting..."
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
