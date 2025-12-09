import { motion } from "framer-motion"
import { Code, Files, Zap, Layers, Command, Folder } from "lucide-react"
import { SectionHeader } from "@/components/SectionHeader"
import { EASE_CURVE } from "@/lib/styles"
import { FEATURES } from "./constants"
import type { FeaturesProps, Feature } from "./types"

const iconMap: Record<string, typeof Code> = {
  code: Code,
  files: Files,
  zap: Zap,
  layers: Layers,
  command: Command,
  folder: Folder,
}

export function Features({ className = "" }: FeaturesProps) {
  return (
    <section className={`px-4 py-16 md:py-24 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <SectionHeader
          title="Powerful Features"
          description="Everything you need for efficient data processing in your terminal"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface FeatureCardProps {
  feature: Feature
  index: number
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const Icon = iconMap[feature.icon] || Code

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
        <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {feature.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {feature.description}
        </p>
      </div>
    </motion.div>
  )
}
