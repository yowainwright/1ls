import { createFileRoute } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import QuickStartContent from '@/content/docs/guides/quick-start.mdx'

export const Route = createFileRoute('/docs/guides/quick-start')({
  component: QuickStartGuide,
})

function QuickStartGuide() {
  return (
    <MDXProvider components={mdxComponents}>
      <QuickStartContent />
    </MDXProvider>
  )
}
