import { Home, FileText, Play } from "lucide-react"
import type { NavLink } from "./types"

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/playground", label: "Playground", icon: Play },
]

export const GITHUB_URL = "https://github.com/yowainwright/1ls"
