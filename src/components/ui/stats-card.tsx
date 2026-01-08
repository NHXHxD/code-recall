import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "default" | "accent" | "muted";
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md",
        variant === "default" && "bg-[var(--card)] border-[var(--border)]",
        variant === "accent" && "bg-[var(--accent)]/5 border-[var(--accent)]/20",
        variant === "muted" && "bg-[var(--muted)] border-[var(--border-subtle)]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--foreground-muted)]">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "rounded-lg p-2",
            variant === "accent"
              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
              : "bg-[var(--muted)] text-[var(--foreground-muted)]"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

