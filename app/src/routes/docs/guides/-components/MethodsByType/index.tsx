import { METHOD_GROUPS } from './constants'

export function MethodsByType() {
  return (
    <div className="space-y-3">
      {METHOD_GROUPS.map((group) => (
        <div key={group.type}>
          <h3 className="font-medium text-primary">{group.type}</h3>
          <p className="text-sm text-muted-foreground">{group.methods}</p>
        </div>
      ))}
    </div>
  )
}
