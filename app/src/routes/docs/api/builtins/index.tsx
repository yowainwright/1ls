import { createFileRoute } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import BuiltinsContent from '@/content/docs/api/builtins.mdx'

export const Route = createFileRoute('/docs/api/builtins/')({
  component: BuiltinsPage,
})

function BuiltinsPage() {
  return (
    <MDXProvider components={mdxComponents}>
      <BuiltinsContent />
    </MDXProvider>
  )
}
