import { createFileRoute } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import ShortcutsContent from '@/content/docs/api/shortcuts.mdx'

export const Route = createFileRoute('/docs/api/shortcuts/')({
  component: ShortcutsPage,
})

function ShortcutsPage() {
  return (
    <MDXProvider components={mdxComponents}>
      <ShortcutsContent />
    </MDXProvider>
  )
}
