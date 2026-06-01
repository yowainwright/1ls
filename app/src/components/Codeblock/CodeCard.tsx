import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { CodeCardProps } from "./types";

export function CodeCard({ children, className, variant = "light" }: CodeCardProps) {
  return (
    <Card
      className={cn(
        "rounded-lg border-border/10 overflow-hidden shadow-none",
        variant === "dark"
          ? "bg-[#282a36]"
          : "shadow-lg shadow-black/5 dark:shadow-black/20",
        className,
      )}
    >
      {children}
    </Card>
  );
}
