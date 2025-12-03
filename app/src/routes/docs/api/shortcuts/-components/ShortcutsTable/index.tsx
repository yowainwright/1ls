import { SHORTCUTS } from '../../-constants'

export function ShortcutsTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/10">
            <th className="py-2 pr-8 text-left font-medium">Shortcut</th>
            <th className="py-2 text-left font-medium">Expands To</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {SHORTCUTS.map((s, i) => (
            <tr
              key={s.shortcut}
              className={i < SHORTCUTS.length - 1 ? 'border-b border-border/10' : ''}
            >
              <td className="py-2 pr-8 font-mono text-primary">{s.shortcut}</td>
              <td className="py-2 font-mono">{s.expands}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
