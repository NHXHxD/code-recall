'use client';

import { useState } from 'react';
import { updateNotes } from '@/lib/actions/notes';

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
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Key Idea
          </label>
          <input
            type="text"
            value={keyIdea}
            onChange={(e) => setKeyIdea(e.target.value)}
            placeholder="One-line summary of the key insight..."
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm"
          />
        </div>

        {/* Content Textarea */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Notes Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-mono resize-y"
            placeholder="Write your notes here..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Notes
              </>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="text-slate-400 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Notes</h2>
        <div className="flex items-center gap-2">
          {initialKeyIdea && (
            <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
              Key: {initialKeyIdea}
            </span>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white px-2 py-1 rounded transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Notes Content Display */}
      <div className="prose prose-invert prose-sm max-w-none">
        <NotesContentDisplay content={content} />
      </div>
    </div>
  );
}

function NotesContentDisplay({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-slate-300">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="text-base font-semibold text-white mt-4 first:mt-0">
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

