import { GRADIENT_HEADER_STYLES } from '@/lib/styles'
import type { PageHeaderProps } from './types'

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8 border-b border-border/10 pb-8">
      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={GRADIENT_HEADER_STYLES}
      >
        {title}
      </h1>
      {description && (
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
