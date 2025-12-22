import { useState } from "react"
import { motion } from "framer-motion"
import { Logo } from "@/components/Logo"
import { siteConfig } from "@/lib/config"
import { EASE_CURVE, GRADIENT_HEADER_STYLES } from "@/lib/styles"
import { Github, Copy, Check } from "lucide-react"

const INSTALL_COMMAND = "npm install -g 1ls"

export default function Hero() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(INSTALL_COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          {/* Main Title */}
          <div className="mb-6 flex w-full justify-center">
            <Logo className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl" />
          </div>

          {/* Subtitle */}
          <motion.h2
            className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE_CURVE }}
            style={GRADIENT_HEADER_STYLES}
          >
            {siteConfig.hero.subtitle}
          </motion.h2>

          {/* Description */}
          <motion.p
            className="mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: EASE_CURVE }}
          >
            {siteConfig.hero.longDescription}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col items-center gap-4 sm:flex-row sm:items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE_CURVE }}
          >
            <a
              href={siteConfig.hero.secondaryCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-base font-medium text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              style={{
                background: "linear-gradient(90deg, rgb(var(--primary)), rgb(var(--accent)), rgb(var(--primary)))",
                backgroundSize: "200% auto",
              }}
            >
              <Github className="h-5 w-5" />
              {siteConfig.hero.secondaryCta}
            </a>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-3 rounded-lg border border-border/10 bg-card px-4 py-3 font-mono text-sm text-card-foreground shadow-md shadow-black/5 transition-all hover:bg-card/80 dark:shadow-black/20"
            >
              <code className="text-primary">{INSTALL_COMMAND}</code>
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
