import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '../-components/PageHeader'
import { Codeblock } from '@/components/Codeblock'

export const Route = createFileRoute('/docs/guides/quick-start')({
  component: QuickStartGuide,
})

function QuickStartGuide() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Quick Start"
        description="Learn the basics of 1ls expressions in 5 minutes."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Property Access</h2>
        <p className="text-muted-foreground">
          Access object properties with familiar dot notation.
        </p>
        <Codeblock
          code={`echo '{"name": "John", "age": 30}' | 1ls '.name'
# Output: "John"`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Array Operations</h2>
        <p className="text-muted-foreground">
          Use JavaScript array methods directly.
        </p>
        <Codeblock
          code={`echo '[1, 2, 3, 4, 5]' | 1ls '.filter(x => x > 2)'
# Output: [3, 4, 5]`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Map with Arrow Functions</h2>
        <p className="text-muted-foreground">
          Transform data with map and arrow functions.
        </p>
        <Codeblock
          code={`echo '[1, 2, 3]' | 1ls '.map(x => x * 2)'
# Output: [2, 4, 6]`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Chaining Methods</h2>
        <p className="text-muted-foreground">
          Chain multiple operations together.
        </p>
        <Codeblock
          code={`echo '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]' | 1ls '.filter(x => x.age > 26).map(x => x.name)'
# Output: ["Alice"]`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Array Indexing</h2>
        <p className="text-muted-foreground">
          Access array elements by index, including negative indexes.
        </p>
        <Codeblock
          code={`echo '["first", "second", "third"]' | 1ls '.[0]'
# Output: "first"

echo '["first", "second", "third"]' | 1ls '.[-1]'
# Output: "third"`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Object Operations</h2>
        <p className="text-muted-foreground">
          Extract keys, values, or entries from objects.
        </p>
        <Codeblock
          code={`echo '{"a": 1, "b": 2, "c": 3}' | 1ls '.{keys}'
# Output: ["a", "b", "c"]

echo '{"a": 1, "b": 2, "c": 3}' | 1ls '.{values}'
# Output: [1, 2, 3]`}
          language="bash"
        />
      </section>
    </div>
  )
}
