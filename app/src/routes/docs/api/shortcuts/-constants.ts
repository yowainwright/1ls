export interface ShortcutEntry {
  shortcut: string
  expands: string
}

export const SHORTCUTS: ShortcutEntry[] = [
  { shortcut: '.mp', expands: '.map' },
  { shortcut: '.flt', expands: '.filter' },
  { shortcut: '.rd', expands: '.reduce' },
  { shortcut: '.fn', expands: '.find' },
  { shortcut: '.fni', expands: '.findIndex' },
  { shortcut: '.sm', expands: '.some' },
  { shortcut: '.ev', expands: '.every' },
  { shortcut: '.sl', expands: '.slice' },
  { shortcut: '.jn', expands: '.join' },
  { shortcut: '.rv', expands: '.reverse' },
  { shortcut: '.st', expands: '.sort' },
  { shortcut: '.fl', expands: '.flat' },
  { shortcut: '.fm', expands: '.flatMap' },
]
