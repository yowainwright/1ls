import { Github, Package } from "lucide-react"
import { siteConfig } from "@/lib/config"

interface FooterProps {
  className?: string
}

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`border-t border-border/10 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center md:text-left">
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
              Licensed under MIT
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href={siteConfig.links.npm}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
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
