import type { CSSProperties } from "react"

export const GRADIENT_HEADER_STYLES: CSSProperties = {
  background: "linear-gradient(135deg, rgb(255 255 255) 0%, rgb(255 245 220) 50%, rgb(255 255 255) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 40px rgb(255 240 200 / 0.25)",
  filter: "drop-shadow(0 0 20px rgb(255 240 200 / 0.15))",
  WebkitTextStroke: "0.5px rgb(220 200 150 / 0.4)",
}

export const LOGO_STYLES: CSSProperties = {
  background: "linear-gradient(90deg, rgb(var(--primary)), rgb(var(--accent)), rgb(var(--primary)))",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  letterSpacing: "-0.05em",
  WebkitTextStroke: "0.3px rgb(139 92 246 / 0.5)",
  filter: "drop-shadow(0 2px 8px rgb(139 92 246 / 0.25)) drop-shadow(0 4px 16px rgb(255 121 198 / 0.15))",
  animation: "logo-sparkle 4s ease-in-out infinite, logo-glow 3s ease-in-out infinite",
}

export const EASE_CURVE = [0.16, 1, 0.3, 1] as const
