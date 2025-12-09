import { motion } from "framer-motion"
import { SectionHeader } from "@/components/SectionHeader"
import { EASE_CURVE } from "@/lib/styles"
import { INSIGHT_STATS } from "./constants"
import type { InsightProps } from "./types"

export function Insights({ className = "" }: InsightProps) {
  return (
    <section className={`px-4 py-16 md:py-24 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <SectionHeader
          title="Built for Speed"
          description="Optimized from the ground up to be lightweight and blazing fast"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {INSIGHT_STATS.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface StatCardProps {
  stat: typeof INSIGHT_STATS[number]
  index: number
}

function StatCard({ stat, index }: StatCardProps) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-xl border border-border/10 bg-card p-6 shadow-md shadow-black/5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 dark:shadow-black/20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASE_CURVE }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <motion.div
          className="mb-2 text-4xl font-bold tracking-tight"
          style={{
            background: "linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--accent)) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {stat.value}
        </motion.div>
        <div className="mb-1 text-sm font-semibold text-foreground">
          {stat.label}
        </div>
        <p className="text-sm text-muted-foreground">
          {stat.description}
        </p>
      </div>
    </motion.div>
  )
}
