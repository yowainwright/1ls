import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '../-components/PageHeader'
import { DocsCard } from '../-components/DocsCard'
import { API_PAGES } from './-constants'

export const Route = createFileRoute('/docs/api/')({
  component: ApiIndex,
})

function ApiIndex() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="API Reference"
        description="Complete reference for 1ls expressions and methods."
      />
      <div className="grid gap-4">
        {API_PAGES.map((page) => (
          <DocsCard key={page.href} {...page} />
        ))}
      </div>
    </div>
  )
}
