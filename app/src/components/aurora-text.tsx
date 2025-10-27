import { cn } from "@/lib/utils"

interface AuroraTextProps {
  children: React.ReactNode
  className?: string
}

export function AuroraText({ children, className }: AuroraTextProps) {
  return (
    <span
      className={cn(
        "relative inline-block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent",
        "animate-[aurora_8s_ease-in-out_infinite_alternate]",
        className
      )}
      style={{
        backgroundImage: "linear-gradient(90deg, rgb(var(--primary)), rgb(var(--accent)), rgb(var(--primary)))",
      }}
    >
      {children}
    </span>
  )
}
