import { motion } from "framer-motion"
import { LOGO_STYLES, EASE_CURVE } from "@/lib/styles"

const LOGO_CONFIG = {
  text: "1ls",
  fontFamily: "'Fira Code', 'FiraCode Nerd Font', ui-monospace, monospace",
}

interface LogoProps {
  className?: string
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <motion.span
      className={`inline-block font-bold tracking-tighter ${className}`}
      initial={{ scale: 2.5, opacity: 0, filter: "blur(10px)" }}
      animate={{
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        y: [0, -4, 0],
      }}
      transition={{
        scale: { duration: 1.2, ease: EASE_CURVE },
        opacity: { duration: 1.2, ease: EASE_CURVE },
        filter: { duration: 1.2, ease: EASE_CURVE },
        y: {
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 1.2,
        },
      }}
      style={{
        ...LOGO_STYLES,
        fontFamily: LOGO_CONFIG.fontFamily,
      }}
    >
      {LOGO_CONFIG.text}
    </motion.span>
  )
}

export { LOGO_CONFIG }
