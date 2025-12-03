import { STEPS } from './constants'

export function ExpressionBuilderSteps() {
  return (
    <div className="rounded-lg border border-border/10 bg-muted/30 p-4">
      <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
        {STEPS.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
