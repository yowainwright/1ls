import { motion } from "framer-motion"
import { SectionHeader } from "@/components/SectionHeader"
import { EASE_CURVE } from "@/lib/styles"
import { TerminalCard } from "./components"
import { TERMINAL_EXAMPLES } from "./constants"

export default function TerminalDemoSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: EASE_CURVE },
    },
  }

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <SectionHeader
          title="See It In Action"
          description="Interactive examples showing how 1ls makes JSON processing simple and intuitive"
        />
        <motion.div
          className="grid gap-6 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {TERMINAL_EXAMPLES.map((example, index) => (
            <motion.div key={index} variants={itemVariants}>
              <TerminalCard example={example} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
