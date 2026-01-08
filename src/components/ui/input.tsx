import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-lg border px-3 py-1 text-base shadow-sm transition-colors",
        "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]",
        "placeholder:text-[var(--foreground-muted)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--foreground)]",
        "md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Input };
