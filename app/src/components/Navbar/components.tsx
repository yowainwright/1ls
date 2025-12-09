import { Link, useLocation } from "@tanstack/react-router"
import { Github } from "lucide-react"
import { LOGO_STYLES } from "@/lib/styles"
import { NAV_LINKS, GITHUB_URL } from "./constants"

export function NavLogo() {
  return (
    <Link to="/" className="flex items-center">
      <span
        className="text-xl font-bold tracking-tighter"
        style={{
          ...LOGO_STYLES,
          animation: undefined,
          filter: undefined,
        }}
      >
        1ls
      </span>
    </Link>
  )
}

export function NavLinks() {
  const location = useLocation()

  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_LINKS.map((link) => {
        const isActive = location.pathname === link.href
        return (
          <Link
            key={link.href}
            to={link.href}
            className={`text-sm font-medium transition-colors ${
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function GithubButton() {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center h-9 w-9 rounded-lg text-accent transition-colors hover:text-accent/80 hover:bg-accent/10"
    >
      <Github className="h-5 w-5" />
      <span className="sr-only">GitHub</span>
    </a>
  )
}
