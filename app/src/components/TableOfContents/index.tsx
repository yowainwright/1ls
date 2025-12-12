import { useState, useEffect, useCallback } from 'react'
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

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  const handleScroll = useCallback(() => {
    const headingElements = headings
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    const scrollY = window.scrollY
    const offset = 120

    let currentId = ''
    for (const element of headingElements) {
      const top = element.getBoundingClientRect().top + scrollY - offset
      if (scrollY >= top) {
        currentId = element.id
      }
    }

    setActiveId(currentId)
  }, [headings])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -100
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <nav aria-label="Table of contents" className={className}>
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        On this page
      </h2>
      <ul className="space-y-1 border-l-2 border-border/20">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={cn(
                'block text-sm transition-colors py-1.5 -ml-px border-l-2',
                heading.level === 2 && 'pl-4',
                heading.level === 3 && 'pl-6',
                heading.level === 4 && 'pl-8',
                activeId === heading.id
                  ? 'text-primary font-medium border-primary'
                  : 'text-foreground/70 hover:text-foreground border-transparent'
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function useHeadings(): TocHeading[] {
  const [headings, setHeadings] = useState<TocHeading[]>([])
  const location = useLocation()

  useEffect(() => {
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('h2[id], h3[id], h4[id]')
      const items: TocHeading[] = Array.from(elements).map((element) => ({
        id: element.id,
        text: element.textContent || '',
        level: parseInt(element.tagName.charAt(1), 10),
      }))
      setHeadings(items)
    }, 100)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return headings
}
