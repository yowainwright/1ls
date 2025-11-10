import { motion } from "framer-motion"
import { TerminalCard } from "./components"
import { TERMINAL_EXAMPLES } from "./constants"

const ease = [0.16, 1, 0.3, 1]

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
      transition: { duration: 0.6, ease },
    },
  }

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <SectionHeader />
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

function SectionHeader() {
  return (
    <motion.div
      className="mb-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
    >
      <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        See It In Action
      </h2>
      <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
        Interactive examples showing how 1ls makes JSON processing simple and intuitive
      </p>
    </motion.div>
  )
}
