import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '../../-components/PageHeader'
import { MethodCard } from '../-components/MethodCard'
import { ARRAY_METHODS } from './-constants'

export const Route = createFileRoute('/docs/api/array-methods/')({
  component: ArrayMethodsPage,
})

function ArrayMethodsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Array Methods"
        description="All standard JavaScript array methods are supported."
      />
      <div className="space-y-8">
        {ARRAY_METHODS.map((method) => (
          <MethodCard key={method.name} {...method} />
        ))}
      </div>
    </div>
  )
}
