import { SHORTCUTS } from './constants'

export function KeyboardShortcuts() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/10">
            <th className="py-2 pr-4 text-left font-medium">Key</th>
            <th className="py-2 text-left font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {SHORTCUTS.map((shortcut, i) => (
            <tr
              key={shortcut.key}
              className={i < SHORTCUTS.length - 1 ? 'border-b border-border/10' : ''}
            >
              <td className="py-2 pr-4 font-mono">{shortcut.key}</td>
              <td className="py-2">{shortcut.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
