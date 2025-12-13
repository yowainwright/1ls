import { useState, useEffect } from "react"
import { NavLogo, NavLinks, GithubButton } from "./components"
import type { NavbarProps } from "./types"

export function Navbar({ className = "" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const bgClasses = isScrolled
    ? "bg-background/80 backdrop-blur-lg shadow-sm border-b border-border/10"
    : "bg-transparent"

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${className}`}
    >
      <div className={`transition-all duration-300 ${bgClasses}`}>
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <NavLogo />
          <NavLinks />
          <GithubButton />
        </div>
      </div>
    </nav>
  )
}
