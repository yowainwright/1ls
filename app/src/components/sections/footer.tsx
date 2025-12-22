import { useEffect } from "react"
import { Github, Package } from "lucide-react"
import { siteConfig } from "@/lib/config"
import { LOGO_STYLES } from "@/lib/styles"

interface FooterProps {
  className?: string
}

export default function Footer({ className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const startYear = 2024

  useEffect(() => {
    const img = new Image()
    img.referrerPolicy = "no-referrer-when-downgrade"
    img.src = "https://static.scarf.sh/a.png?x-pxid=500dd7ce-0f58-4763-b6a7-fc992b6a12cb"
  }, [])

  return (
    <footer className={`border-t border-border/10 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span
              className="text-2xl font-bold tracking-tighter"
              style={{
                ...LOGO_STYLES,
                animation: undefined,
                filter: undefined,
              }}
            >
              1ls
            </span>
            <p className="text-sm text-muted-foreground">
              Built by{" "}
              <a
                href="https://jeffry.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-foreground"
              >
                Jeff Wainwright
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              © {startYear}–{currentYear} MIT License
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent transition-colors hover:text-accent/80"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href={siteConfig.links.npm}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent transition-colors hover:text-accent/80"
              aria-label="npm"
            >
              <Package className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
