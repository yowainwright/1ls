import type { PageHeaderProps } from './types'

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
