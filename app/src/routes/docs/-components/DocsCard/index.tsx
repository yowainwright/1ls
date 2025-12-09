import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { DocsCardProps } from './types'

export function DocsCard({ href, title, description }: DocsCardProps) {
  return (
    <Link
      to={href}
      className="group flex flex-col rounded-xl border border-border/10 bg-card p-6 shadow-md shadow-black/5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 dark:shadow-black/20"
    >
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Learn more
        <ArrowRight className="ml-1 h-4 w-4" />
      </div>
    </Link>
  )
}
