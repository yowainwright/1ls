import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { DOCS_NAV } from './constants'
import type { NavSection, NavItem } from './types'

export function DocsSidebar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <MobileSidebarTrigger open={mobileOpen} onOpenChange={setMobileOpen} pathname={location.pathname} />
      <DesktopSidebar pathname={location.pathname} />
    </>
  )
}

interface MobileSidebarTriggerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pathname: string
}

function MobileSidebarTrigger({ open, onOpenChange, pathname }: MobileSidebarTriggerProps) {
  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'fixed top-20 z-40 transition-all duration-300',
              open ? 'left-4' : 'left-1/2 -translate-x-1/2'
            )}
            aria-label="Toggle navigation"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-background">
          <SheetHeader className="sr-only">
            <SheetTitle>Documentation Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNavContent pathname={pathname} onNavigate={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface DesktopSidebarProps {
  pathname: string
}

function DesktopSidebar({ pathname }: DesktopSidebarProps) {
  return (
    <aside className="hidden md:block w-72 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-border/10">
      <SidebarNavContent pathname={pathname} />
    </aside>
  )
}

interface SidebarNavContentProps {
  pathname: string
  onNavigate?: () => void
}

function SidebarNavContent({ pathname, onNavigate }: SidebarNavContentProps) {
  return (
    <nav className="p-4 space-y-6">
      {DOCS_NAV.map((section) => (
        <SidebarSection
          key={section.title}
          section={section}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  )
}

interface SidebarSectionProps {
  section: NavSection
  pathname: string
  onNavigate?: () => void
}

function SidebarSection({ section, pathname, onNavigate }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-2 py-1.5 text-sm font-semibold text-foreground/70 uppercase tracking-wide hover:text-foreground transition-colors"
      >
        <span>{section.title}</span>
        <ChevronRight
          className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-90')}
        />
      </button>
      {isOpen && (
        <div className="ml-2 mt-1 border-l-2 border-border/20">
          <ul className="space-y-1">
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface SidebarNavItemProps {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}

function SidebarNavItem({ item, pathname, onNavigate }: SidebarNavItemProps) {
  const isActive = pathname === item.href

  return (
    <li>
      <Link
        to={item.href}
        onClick={onNavigate}
        className={cn(
          'block py-2 px-3 text-sm transition-colors relative',
          'hover:text-primary hover:bg-primary/10',
          isActive
            ? 'text-primary bg-primary/10 font-medium before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-0.5 before:bg-primary'
            : 'text-foreground/70'
        )}
      >
        {item.title}
      </Link>
    </li>
  )
}
