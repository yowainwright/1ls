import { useState } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { Menu, Home, FileText, Play, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { NAV_LINKS, GITHUB_URL } from "./constants"

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/": <Home className="h-5 w-5" />,
  "/docs": <FileText className="h-5 w-5" />,
  "/playground": <Play className="h-5 w-5" />,
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Site navigation links</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col h-full">
            <div className="flex-1 pt-12 pb-6">
              <ul className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => {
                  const isActive = location.pathname === link.href
                  return (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {NAV_ICONS[link.href]}
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="border-t px-4 py-4">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
                GitHub
              </a>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
