'use client';

import { useState } from 'react';
import { Check, Pencil, Loader2 } from 'lucide-react';
import { updateNotes } from '@/lib/actions/notes';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface NotesEditorProps {
  problemId: string;
  initialContent: string;
  initialKeyIdea: string | null;
}

export function NotesEditor({ problemId, initialContent, initialKeyIdea }: NotesEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [keyIdea, setKeyIdea] = useState(initialKeyIdea || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await updateNotes(problemId, content, keyIdea || undefined);
      if (result.success) {
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to save notes');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    setKeyIdea(initialKeyIdea || '');
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Key Idea Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
            Key Idea
          </label>
          <Input
            type="text"
            value={keyIdea}
            onChange={(e) => setKeyIdea(e.target.value)}
            placeholder="One-line summary of the key insight..."
          />
        </div>

        {/* Content Textarea */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
            Notes Content
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="font-mono resize-y"
            placeholder="Write your notes here..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="primary"
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Notes
              </>
            )}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isSaving}
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Edit Button */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Notes</h2>
        <div className="flex items-center gap-2">
          {initialKeyIdea && (
            <Badge variant="secondary" className="font-normal">
              Key: {initialKeyIdea}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1.5"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Notes Content Display */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <NotesContentDisplay content={content} />
      </div>
    </div>
  );
}

function NotesContentDisplay({ content }: { content: string }) {
  const lines = content.split('\n');

  if (!content.trim()) {
    return (
      <p className="text-sm text-[var(--foreground-muted)] italic">
        No notes yet. Click Edit to add some.
      </p>
    );
  }

  return (
    <div className="space-y-2 text-[var(--foreground-muted)]">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="mt-4 text-base font-semibold text-[var(--foreground)] first:mt-0">
              {line.replace('## ', '')}
            </h3>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <p key={i} className="pl-4 text-sm">• {line.replace('- ', '')}</p>
          );
        }
        if (line.trim()) {
          return <p key={i} className="text-sm">{line}</p>;
        }
        return null;
      })}
    </div>
  );
}
