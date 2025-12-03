import type { Shortcut } from './types'

export const SHORTCUTS: Shortcut[] = [
  { key: '↑/↓', action: 'Navigate methods/properties' },
  { key: '→ or Tab', action: 'Accept/complete method or property' },
  { key: '←', action: 'Undo last segment' },
  { key: 'Enter', action: 'Execute expression' },
  { key: 'Esc', action: 'Go back to Explorer / Quit' },
  { key: 'q', action: 'Quit (from Explorer)' },
]
