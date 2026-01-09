'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, ExternalLink } from 'lucide-react';
import { CountdownBadge } from './countdown-badge';
import { ProblemEditForm } from './problem-edit-form';
import { DifficultyBadge } from './ui/difficulty-badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
    difficulty?: number;  // FSRS difficulty (1-10), may be undefined for old data
    stability?: number;   // FSRS stability in days, may be undefined for old data
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
      <Card className="border-[var(--border)]">
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit Problem</h2>
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)]">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <DifficultyBadge difficulty={problem.difficulty} />
              {/* Live Countdown Badge */}
              {!problem.review_state.suspended && (
                <CountdownBadge dueAt={problem.review_state.due_at} showLabel />
              )}
              {problem.review_state.suspended && (
                <Badge variant="warning">Reviews Paused</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{problem.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            {problem.url && (
              <a
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2 text-orange-600 hover:text-orange-700 dark:text-orange-400">
                  <ExternalLink className="h-4 w-4" />
                  Open on LeetCode
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Topics */}
        {problem.topics.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {problem.topics.map((topic) => (
              <Badge key={topic} variant="secondary" className="font-normal">
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {/* Review State Info */}
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-4 md:grid-cols-4">
          <InfoItem
            label="Next Review"
            value={format(new Date(problem.review_state.due_at), 'MMM d, yyyy')}
          />
          <InfoItem
            label="Repetition"
            value={`#${problem.review_state.reps + 1}`}
          />
          <InfoItem
            label="Stability"
            value={`${(problem.review_state.stability ?? problem.review_state.interval_days).toFixed(1)}d`}
          />
          <InfoItem
            label="Interval"
            value={`${Math.round(problem.review_state.interval_days)} days`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-[var(--foreground-muted)]">{label}</p>
      <p className="text-sm font-medium text-[var(--foreground)]">{value}</p>
    </div>
  );
}
