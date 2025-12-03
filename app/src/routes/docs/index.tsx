import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from './-components/PageHeader'
import { DocsCard } from './-components/DocsCard'
import { CARDS } from './-constants'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Documentation"
        description="Learn how to use 1ls to process data with familiar JavaScript syntax."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <DocsCard key={card.href} {...card} />
        ))}
      </div>
    </div>
  )
}
