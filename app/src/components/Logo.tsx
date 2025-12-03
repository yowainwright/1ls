const LOGO_CONFIG = {
  text: "1ls",
  fontFamily: "'Fira Code', 'FiraCode Nerd Font', ui-monospace, monospace",
}

interface LogoProps {
  className?: string
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <span
      className={`inline-block animate-aurora font-bold tracking-tighter ${className}`}
      style={{
        background: "linear-gradient(90deg, rgb(var(--primary)), rgb(var(--accent)), rgb(var(--primary)))",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        fontFamily: LOGO_CONFIG.fontFamily,
        letterSpacing: "-0.05em",
      }}
    >
      {LOGO_CONFIG.text}
    </span>
  )
}

export { LOGO_CONFIG }
