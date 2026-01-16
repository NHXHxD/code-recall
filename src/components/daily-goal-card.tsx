'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Pencil, Check, X } from 'lucide-react';

interface DailyGoalTargets {
  easy: number;
  medium: number;
  hard: number;
}

interface ProblemsAddedToday {
  easy: number;
  medium: number;
  hard: number;
}

interface DailyGoalCardProps {
  addedToday: ProblemsAddedToday;
}

const LOCAL_STORAGE_KEY = 'code-recall-daily-goals';

const DEFAULT_TARGETS: DailyGoalTargets = {
  easy: 3,
  medium: 2,
  hard: 1,
};

function loadTargets(): DailyGoalTargets {
  if (typeof window === 'undefined') return DEFAULT_TARGETS;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        easy: parsed.easy ?? DEFAULT_TARGETS.easy,
        medium: parsed.medium ?? DEFAULT_TARGETS.medium,
        hard: parsed.hard ?? DEFAULT_TARGETS.hard,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_TARGETS;
}

function saveTargets(targets: DailyGoalTargets): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(targets));
  } catch {
    // Ignore storage errors
  }
}

interface ProgressRowProps {
  label: string;
  current: number;
  target: number;
  colorVar: string;
  bgVar: string;
  delay: number;
  isEditing: boolean;
  editValue: number;
  onEditChange: (value: number) => void;
}

function ProgressRow({ 
  label, 
  current, 
  target, 
  colorVar, 
  bgVar, 
  delay,
  isEditing,
  editValue,
  onEditChange,
}: ProgressRowProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isComplete = current >= target;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <span 
          className="text-sm font-medium"
          style={{ color: `var(${colorVar})` }}
        >
          {label}
        </span>
        <div className="flex items-center gap-1">
          <span 
            className={`text-sm font-medium ${
              isComplete ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'
            }`}
          >
            {current}
          </span>
          <span className="text-sm text-[var(--foreground-muted)]">/</span>
          {isEditing ? (
            <input
              type="number"
              min={0}
              max={99}
              value={editValue}
              onChange={(e) => onEditChange(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
              className="w-10 h-6 text-sm font-medium text-center rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          ) : (
            <span className="text-sm font-medium text-[var(--foreground-muted)]">
              {target}
            </span>
          )}
        </div>
      </div>
      <div 
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: `var(${bgVar})` }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: `var(${colorVar})` }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: delay + 0.1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export function DailyGoalCard({ addedToday }: DailyGoalCardProps) {
  const [targets, setTargets] = useState<DailyGoalTargets>(DEFAULT_TARGETS);
  const [isEditing, setIsEditing] = useState(false);
  const [editTargets, setEditTargets] = useState<DailyGoalTargets>(DEFAULT_TARGETS);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load targets from localStorage on mount
  useEffect(() => {
    const loaded = loadTargets();
    setTargets(loaded);
    setEditTargets(loaded);
    setIsHydrated(true);
  }, []);

  const totalCurrent = addedToday.easy + addedToday.medium + addedToday.hard;
  const totalTarget = targets.easy + targets.medium + targets.hard;
  const allComplete = totalCurrent >= totalTarget;

  const handleEdit = () => {
    setEditTargets({ ...targets });
    setIsEditing(true);
  };

  const handleSave = () => {
    setTargets(editTargets);
    saveTargets(editTargets);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTargets({ ...targets });
    setIsEditing(false);
  };

  // Show placeholder while hydrating to avoid flash
  if (!isHydrated) {
    return (
      <Card className="border-[var(--border)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Daily Goal</CardTitle>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--foreground-muted)]" />
              <span className="text-sm font-medium text-[var(--foreground-muted)]">
                0 / 0
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-[88px] animate-pulse bg-[var(--muted)] rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Daily Goal</CardTitle>
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit-buttons"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4 text-[var(--foreground-muted)]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    className="h-7 w-7 p-0"
                  >
                    <Check className="h-4 w-4 text-[var(--accent)]" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="view-buttons"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-7 w-7 p-0"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)]" />
                  </Button>
                  <Target 
                    className={`h-4 w-4 ${
                      allComplete ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'
                    }`} 
                  />
                  <span className={`text-sm font-medium ${
                    allComplete ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'
                  }`}>
                    {totalCurrent} / {totalTarget}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProgressRow
          label="Easy"
          current={addedToday.easy}
          target={targets.easy}
          colorVar="--easy"
          bgVar="--easy-bg"
          delay={0.1}
          isEditing={isEditing}
          editValue={editTargets.easy}
          onEditChange={(v) => setEditTargets(prev => ({ ...prev, easy: v }))}
        />
        <ProgressRow
          label="Medium"
          current={addedToday.medium}
          target={targets.medium}
          colorVar="--medium"
          bgVar="--medium-bg"
          delay={0.15}
          isEditing={isEditing}
          editValue={editTargets.medium}
          onEditChange={(v) => setEditTargets(prev => ({ ...prev, medium: v }))}
        />
        <ProgressRow
          label="Hard"
          current={addedToday.hard}
          target={targets.hard}
          colorVar="--hard"
          bgVar="--hard-bg"
          delay={0.2}
          isEditing={isEditing}
          editValue={editTargets.hard}
          onEditChange={(v) => setEditTargets(prev => ({ ...prev, hard: v }))}
        />
      </CardContent>
    </Card>
  );
}
