import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '../-components/PageHeader'
import { DocsCard } from '../-components/DocsCard'

export const Route = createFileRoute('/docs/guides/')({
  component: GuidesIndex,
})

const GUIDES = [
  {
    href: '/docs/guides/installation',
    title: 'Installation',
    description: 'Get started with 1ls via npm, Homebrew, or curl.',
  },
  {
    href: '/docs/guides/quick-start',
    title: 'Quick Start',
    description: 'Learn the basics of 1ls expressions in 5 minutes.',
  },
  {
    href: '/docs/guides/interactive-mode',
    title: 'Interactive Mode',
    description: 'Explore JSON interactively with fuzzy search.',
  },
]

function GuidesIndex() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Guides"
        description="Step-by-step tutorials to get you started with 1ls."
      />
      <div className="grid gap-4">
        {GUIDES.map((guide) => (
          <DocsCard key={guide.href} {...guide} />
        ))}
      </div>
    </div>
  )
}
