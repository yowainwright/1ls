import { motion } from "framer-motion"
import { AuroraText } from "@/components/aurora-text"
import { siteConfig } from "@/lib/config"
import { Github } from "lucide-react"

const ease = [0.16, 1, 0.3, 1]

export default function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          {/* Main Title */}
          <motion.div
            className="mb-6 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
          >
            <h1 className="px-8 text-7xl font-bold tracking-tighter sm:text-8xl md:text-9xl lg:text-[12rem]">
              <AuroraText className="font-black">
                {siteConfig.hero.title}
              </AuroraText>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="mb-4 text-xl font-medium text-muted-foreground sm:text-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
          >
            {siteConfig.hero.subtitle}
          </motion.p>

          {/* Description */}
          <motion.p
            className="mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease }}
          >
            {siteConfig.hero.longDescription}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col items-center gap-4 sm:flex-row sm:items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease }}
          >
            <a
              href={siteConfig.hero.secondaryCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Github className="h-5 w-5" />
              {siteConfig.hero.secondaryCta}
            </a>
            <div className="rounded-lg border border-border bg-card px-4 py-3 font-mono text-sm text-card-foreground shadow-sm">
              <code className="text-primary">npm install -g 1ls</code>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
