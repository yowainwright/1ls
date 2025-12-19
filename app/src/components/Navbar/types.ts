import type { LucideIcon } from "lucide-react"

export interface NavLink {
  href: string
  label: string
  icon?: LucideIcon
}

export interface NavbarProps {
  className?: string
}
