import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { DOCS_NAV } from './constants'
import type { NavSection, NavItem } from './types'

export function DocsSidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-border/10 bg-background/50">
      <nav className="p-4 pb-8">
        {DOCS_NAV.map((section, index) => (
          <SidebarSection
            key={section.title}
            section={section}
            pathname={location.pathname}
            defaultOpen={true}
          />
        ))}
      </nav>
    </aside>
  )
}

interface SidebarSectionProps {
  section: NavSection
  pathname: string
  defaultOpen?: boolean
}

function SidebarSection({ section, pathname, defaultOpen = true }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-sm font-semibold text-foreground hover:text-foreground/80"
      >
        {section.title}
        <ChevronRight
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && (
        <ul className="mt-2 space-y-1">
          {section.items.map((item) => (
            <SidebarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      )}
    </div>
  )
}

interface SidebarItemProps {
  item: NavItem
  pathname: string
}

function SidebarItem({ item, pathname }: SidebarItemProps) {
  const isActive = pathname === item.href

  return (
    <li>
      <Link
        to={item.href}
        className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground ${
          isActive
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground'
        }`}
      >
        {item.title}
      </Link>
    </li>
  )
}
