import type { MDXComponents } from 'mdx/types'
import { Codeblock } from '@/components/Codeblock'
import { cn } from '@/lib/utils'
import { KeyboardShortcuts } from '@/routes/docs/guides/-components/KeyboardShortcuts'
import { MethodsByType } from '@/routes/docs/guides/-components/MethodsByType'
import { ExpressionBuilderSteps } from '@/routes/docs/guides/-components/ExpressionBuilderSteps'
import { FormatsTable } from '@/routes/docs/api/formats/-components/FormatsTable'
import { ShortcutsTable } from '@/routes/docs/api/shortcuts/-components/ShortcutsTable'
import { CliCommands } from '@/routes/docs/api/shortcuts/-components/CliCommands'
import { MethodCard } from '@/routes/docs/api/-components/MethodCard'
import { ARRAY_METHODS } from '@/routes/docs/api/array-methods/-constants'

function ArrayMethodsList() {
  return (
    <div className="space-y-8">
      {ARRAY_METHODS.map((method) => (
        <MethodCard key={method.name} {...method} />
      ))}
    </div>
  )
}

export const mdxComponents: MDXComponents = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn('text-4xl font-bold tracking-tight mt-8 mb-4', className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn('text-2xl font-semibold tracking-tight mt-10 mb-4 scroll-mt-24', className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn('text-xl font-semibold tracking-tight mt-8 mb-3 scroll-mt-24', className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn('text-lg font-semibold tracking-tight mt-6 mb-2 scroll-mt-24', className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn('leading-7 text-muted-foreground [&:not(:first-child)]:mt-4', className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn('my-4 ml-6 list-disc text-muted-foreground [&>li]:mt-2', className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn('my-4 ml-6 list-decimal text-muted-foreground [&>li]:mt-2', className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn('', className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn('mt-4 border-l-4 border-primary/50 pl-4 italic text-muted-foreground', className)}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn('text-primary underline underline-offset-4 hover:text-primary/80', className)}
      {...props}
    />
  ),
  pre: ({ children, className, ...props }) => {
    return (
      <div className={cn('shiki-wrapper group relative my-6 rounded-lg border border-border/10 overflow-hidden', className)}>
        <pre className="overflow-x-auto p-4 pt-12 text-sm" {...props}>
          {children}
        </pre>
      </div>
    )
  },
  code: ({ className, children, ...props }) => {
    const isInline = typeof children === 'string' && !children.includes('\n')
    if (isInline) {
      return (
        <code
          className={cn('bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono', className)}
          {...props}
        >
          {children}
        </code>
      )
    }
    return <code className={className} {...props}>{children}</code>
  },
  table: ({ className, ...props }) => (
    <div className="my-6 w-full overflow-auto">
      <table
        className={cn('w-full border-collapse text-sm', className)}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn('border border-border/20 px-4 py-2 text-left font-semibold', className)}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn('border border-border/20 px-4 py-2', className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn('my-8 border-border/20', className)} {...props} />
  ),
  Codeblock,
  KeyboardShortcuts,
  MethodsByType,
  ExpressionBuilderSteps,
  FormatsTable,
  ShortcutsTable,
  CliCommands,
  ArrayMethodsList,
}
