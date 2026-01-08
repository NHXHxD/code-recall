'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownBadgeProps {
  dueAt: string; // ISO 8601 UTC timestamp
  showLabel?: boolean; // Show "Next review in" / "Overdue by" prefix
}

type CountdownStatus = 'future' | 'soon' | 'overdue';

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  status: CountdownStatus;
}

/**
 * Format a number to 2 digits with leading zero
 */
function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Calculate countdown state from delta milliseconds
 */
function calculateCountdown(deltaMs: number): CountdownState {
  const isOverdue = deltaMs <= 0;
  const absDelta = Math.abs(deltaMs);
  
  // Convert to total seconds
  const totalSeconds = Math.floor(absDelta / 1000);
  
  // Derive hours, minutes, seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // Determine status
  let status: CountdownStatus;
  if (isOverdue) {
    status = 'overdue';
  } else if (deltaMs <= 60 * 60 * 1000) {
    // Less than or equal to 1 hour
    status = 'soon';
  } else {
    status = 'future';
  }
  
  return { hours, minutes, seconds, status };
}

/**
 * Get Tailwind classes based on countdown status
 */
function getStatusClasses(status: CountdownStatus): string {
  switch (status) {
    case 'future':
      return 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20';
    case 'soon':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400';
    case 'overdue':
      return 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400';
  }
}

export function CountdownBadge({ dueAt, showLabel = false }: CountdownBadgeProps) {
  const [countdown, setCountdown] = useState<CountdownState>(() => {
    const delta = new Date(dueAt).getTime() - Date.now();
    return calculateCountdown(delta);
  });

  useEffect(() => {
    // Update immediately in case component mounted with stale state
    const updateCountdown = () => {
      const delta = new Date(dueAt).getTime() - Date.now();
      setCountdown(calculateCountdown(delta));
    };
    
    updateCountdown();
    
    // Set up interval for 1-second updates
    const intervalId = setInterval(updateCountdown, 1000);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [dueAt]);

  const timeString = `${pad2(countdown.hours)}:${pad2(countdown.minutes)}:${pad2(countdown.seconds)}`;
  const statusClasses = getStatusClasses(countdown.status);

  // Build display text
  let displayText: string;
  if (showLabel) {
    if (countdown.status === 'overdue') {
      displayText = `Overdue by ${timeString}`;
    } else {
      displayText = `Next review in ${timeString}`;
    }
  } else {
    if (countdown.status === 'overdue') {
      displayText = `Overdue by ${timeString}`;
    } else {
      displayText = timeString;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-mono",
        statusClasses
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      {displayText}
    </span>
  );
}
