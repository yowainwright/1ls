"use client"

import { useEffect, useMemo, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export interface TocHeading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  headings: TocHeading[]
  className?: string
}

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (itemIds.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0% 0% -80% 0%' }
    )

    itemIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      itemIds.forEach((id) => {
        const element = document.getElementById(id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [itemIds])

  return activeId
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const itemIds = useMemo(() => headings.map((h) => h.id), [headings])
  const activeId = useActiveItem(itemIds)

  if (headings.length === 0) {
    return null
  }

  return (
    <nav aria-label="Table of contents" className={className}>
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        On this page
      </h2>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => {
          const isActive = activeId === heading.id
          const indentClass = heading.level === 2 ? '' : heading.level === 3 ? 'pl-4' : 'pl-6'

          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  'block py-1 transition-colors',
                  indentClass,
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function useHeadings(): TocHeading[] {
  const [headings, setHeadings] = useState<TocHeading[]>([])
  const location = useLocation()

  useEffect(() => {
    const findHeadings = () => {
      const elements = document.querySelectorAll('h2[id], h3[id], h4[id]')
      const items: TocHeading[] = Array.from(elements).map((element) => ({
        id: element.id,
        text: element.textContent || '',
        level: parseInt(element.tagName.charAt(1), 10),
      }))
      return items
    }

    const updateHeadings = () => {
      const items = findHeadings()
      setHeadings(items)
    }

    updateHeadings()

    const observer = new MutationObserver(() => {
      updateHeadings()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [location.pathname])

  return headings
}
