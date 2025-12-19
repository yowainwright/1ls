import type { NavSection } from './types'

export const DOCS_NAV: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Installation', href: '/docs/guides/installation' },
      { title: 'Quick Start', href: '/docs/guides/quick-start' },
      { title: 'Interactive Mode', href: '/docs/guides/interactive-mode' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'Array Methods', href: '/docs/api/array-methods' },
      { title: 'Builtin Functions', href: '/docs/api/builtins' },
      { title: 'Shortcuts', href: '/docs/api/shortcuts' },
      { title: 'Multi-format', href: '/docs/api/formats' },
    ],
  },
  {
    title: 'Performance',
    items: [
      { title: 'Benchmarks', href: '/docs/benchmarks' },
    ],
  },
]
