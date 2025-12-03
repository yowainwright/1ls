import { Link } from '@tanstack/react-router'
import type { DocsCardProps } from './types'

export function DocsCard({ href, title, description }: DocsCardProps) {
  return (
    <Link
      to={href}
      className="group rounded-lg border border-border/10 p-6 transition-colors hover:bg-muted/50"
    >
      <h3 className="font-semibold group-hover:text-primary">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}
