import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CodeCardProps {
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark";
}

export function CodeCard({ children, className, variant = "light" }: CodeCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/10 overflow-hidden",
        variant === "dark"
          ? "bg-[#282a36]"
          : "bg-card shadow-lg shadow-black/5 dark:shadow-black/20",
        className,
      )}
    >
      {children}
    </div>
  );
}
