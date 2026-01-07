'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CountdownBadge } from './countdown-badge';
import { ProblemEditForm } from './problem-edit-form';
import type { Difficulty } from '@/types/database';

interface ProblemData {
  id: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  url: string | null;
  review_state: {
    due_at: string;
    reps: number;
    ease: number;
    interval_days: number;
    suspended: boolean;
  };
}

interface ProblemDetailClientProps {
  problem: ProblemData;
}

export function ProblemDetailClient({ problem }: ProblemDetailClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Edit Problem</h2>
        </div>
        <ProblemEditForm
          problemId={problem.id}
          initialTitle={problem.title}
          initialDifficulty={problem.difficulty}
          initialTopics={problem.topics}
          initialUrl={problem.url}
          initialSuspended={problem.review_state.suspended}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            {/* Live Countdown Badge */}
            {!problem.review_state.suspended && (
              <CountdownBadge dueAt={problem.review_state.due_at} showLabel />
            )}
            {problem.review_state.suspended && (
              <span className="text-xs px-2.5 py-1 rounded-lg border bg-amber-500/20 text-amber-400 border-amber-500/30">
                Reviews Paused
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          {problem.url && (
            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
              </svg>
              Open on LeetCode
            </a>
          )}
        </div>
      </div>

      {/* Topics */}
      {problem.topics.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {problem.topics.map((topic) => (
            <span
              key={topic}
              className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-400"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Review State Info */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoItem
          label="Next Review"
          value={format(new Date(problem.review_state.due_at), 'MMM d, yyyy')}
        />
        <InfoItem
          label="Repetition"
          value={`#${problem.review_state.reps + 1}`}
        />
        <InfoItem
          label="Ease Factor"
          value={problem.review_state.ease.toFixed(2)}
        />
        <InfoItem
          label="Interval"
          value={`${Math.round(problem.review_state.interval_days)} days`}
        />
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    Easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`text-sm px-3 py-1 rounded-lg border ${colors[difficulty as keyof typeof colors] || colors.Medium}`}>
      {difficulty}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}

