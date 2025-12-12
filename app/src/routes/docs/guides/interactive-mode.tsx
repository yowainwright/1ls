import { createFileRoute } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import InteractiveModeContent from '@/content/docs/guides/interactive-mode.mdx'

export const Route = createFileRoute('/docs/guides/interactive-mode')({
  component: InteractiveModeGuide,
})

function InteractiveModeGuide() {
  return (
    <MDXProvider components={mdxComponents}>
      <InteractiveModeContent />
    </MDXProvider>
  )
}
