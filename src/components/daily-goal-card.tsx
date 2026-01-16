'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface GoalProgress {
  current: number;
  target: number;
}

interface DailyGoals {
  easy: GoalProgress;
  medium: GoalProgress;
  hard: GoalProgress;
}

interface DailyGoalCardProps {
  goals?: DailyGoals;
}

// Mock state - easy to wire up to backend later
const defaultGoals: DailyGoals = {
  easy: { current: 2, target: 3 },
  medium: { current: 0, target: 2 },
  hard: { current: 1, target: 1 },
};

interface ProgressRowProps {
  label: string;
  current: number;
  target: number;
  colorVar: string;
  bgVar: string;
  delay: number;
}

function ProgressRow({ label, current, target, colorVar, bgVar, delay }: ProgressRowProps) {
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
        <span 
          className={`text-sm font-medium ${
            isComplete ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'
          }`}
        >
          {current} / {target}
        </span>
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

export function DailyGoalCard({ goals = defaultGoals }: DailyGoalCardProps) {
  const totalCurrent = goals.easy.current + goals.medium.current + goals.hard.current;
  const totalTarget = goals.easy.target + goals.medium.target + goals.hard.target;
  const allComplete = totalCurrent >= totalTarget;

  return (
    <Card className="border-[var(--border)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Daily Goal</CardTitle>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProgressRow
          label="Easy"
          current={goals.easy.current}
          target={goals.easy.target}
          colorVar="--easy"
          bgVar="--easy-bg"
          delay={0.1}
        />
        <ProgressRow
          label="Medium"
          current={goals.medium.current}
          target={goals.medium.target}
          colorVar="--medium"
          bgVar="--medium-bg"
          delay={0.15}
        />
        <ProgressRow
          label="Hard"
          current={goals.hard.current}
          target={goals.hard.target}
          colorVar="--hard"
          bgVar="--hard-bg"
          delay={0.2}
        />
      </CardContent>
    </Card>
  );
}
