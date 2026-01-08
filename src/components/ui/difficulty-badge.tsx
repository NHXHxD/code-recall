import * as React from "react";
import { Badge } from "@/components/ui/badge";

interface DifficultyBadgeProps {
  difficulty: string;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const variant = difficulty.toLowerCase() as "easy" | "medium" | "hard";
  
  return (
    <Badge 
      variant={variant === "easy" || variant === "medium" || variant === "hard" ? variant : "secondary"}
      className={className}
    >
      {difficulty}
    </Badge>
  );
}

