import { createFileRoute } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import BenchmarksContent from '@/content/docs/benchmarks.mdx'

export const Route = createFileRoute('/docs/benchmarks/')({
  component: BenchmarksPage,
})

function BenchmarksPage() {
  return (
    <MDXProvider components={mdxComponents}>
      <BenchmarksContent />
    </MDXProvider>
  )
}
