import { createFileRoute } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import ArrayMethodsContent from '@/content/docs/api/array-methods.mdx'

export const Route = createFileRoute('/docs/api/array-methods/')({
  component: ArrayMethodsPage,
})

function ArrayMethodsPage() {
  return (
    <MDXProvider components={mdxComponents}>
      <ArrayMethodsContent />
    </MDXProvider>
  )
}
