import { motion } from "framer-motion"
import { GRADIENT_HEADER_STYLES, EASE_CURVE } from "@/lib/styles"
import type { SectionHeaderProps } from "./types"

export function SectionHeader({ title, description, className = "" }: SectionHeaderProps) {
  return (
    <div className={`mb-8 text-center ${className}`}>
      <motion.h2
        className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE_CURVE }}
        style={GRADIENT_HEADER_STYLES}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          className="mx-auto max-w-2xl text-lg text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_CURVE }}
        >
          {description}
        </motion.p>
      )}
    </div>
  )
}
