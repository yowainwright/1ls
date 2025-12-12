import { createFileRoute } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import InstallationContent from '@/content/docs/guides/installation.mdx'

export const Route = createFileRoute('/docs/guides/installation')({
  component: InstallationGuide,
})

function InstallationGuide() {
  return (
    <MDXProvider components={mdxComponents}>
      <InstallationContent />
    </MDXProvider>
  )
}
