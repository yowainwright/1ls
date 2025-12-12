import { createFileRoute } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import FormatsContent from '@/content/docs/api/formats.mdx'

export const Route = createFileRoute('/docs/api/formats/')({
  component: FormatsPage,
})

function FormatsPage() {
  return (
    <MDXProvider components={mdxComponents}>
      <FormatsContent />
    </MDXProvider>
  )
}
