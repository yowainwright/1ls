export interface ShortcutEntry {
  shortcut: string
  expands: string
  category?: string
}

export const ARRAY_METHOD_SHORTCUTS: ShortcutEntry[] = [
  { shortcut: '.mp', expands: '.map', category: 'array' },
  { shortcut: '.flt', expands: '.filter', category: 'array' },
  { shortcut: '.rd', expands: '.reduce', category: 'array' },
  { shortcut: '.fn', expands: '.find', category: 'array' },
  { shortcut: '.fni', expands: '.findIndex', category: 'array' },
  { shortcut: '.sm', expands: '.some', category: 'array' },
  { shortcut: '.ev', expands: '.every', category: 'array' },
  { shortcut: '.sl', expands: '.slice', category: 'array' },
  { shortcut: '.jn', expands: '.join', category: 'array' },
  { shortcut: '.rv', expands: '.reverse', category: 'array' },
  { shortcut: '.st', expands: '.sort', category: 'array' },
  { shortcut: '.fl', expands: '.flat', category: 'array' },
  { shortcut: '.fm', expands: '.flatMap', category: 'array' },
]

export const BUILTIN_SHORTCUTS: ShortcutEntry[] = [
  { shortcut: 'hd', expands: 'head', category: 'builtin' },
  { shortcut: 'lst', expands: 'last', category: 'builtin' },
  { shortcut: 'tl', expands: 'tail', category: 'builtin' },
  { shortcut: 'tk', expands: 'take', category: 'builtin' },
  { shortcut: 'drp', expands: 'drop', category: 'builtin' },
  { shortcut: 'unq', expands: 'uniq', category: 'builtin' },
  { shortcut: 'fltn', expands: 'flatten', category: 'builtin' },
  { shortcut: 'chnk', expands: 'chunk', category: 'builtin' },
  { shortcut: 'cmpct', expands: 'compact', category: 'builtin' },
  { shortcut: 'ks', expands: 'keys', category: 'builtin' },
  { shortcut: 'pk', expands: 'pick', category: 'builtin' },
  { shortcut: 'omt', expands: 'omit', category: 'builtin' },
  { shortcut: 'mrg', expands: 'merge', category: 'builtin' },
  { shortcut: 'dMrg', expands: 'deepMerge', category: 'builtin' },
  { shortcut: 'frPrs', expands: 'fromPairs', category: 'builtin' },
  { shortcut: 'toPrs', expands: 'toPairs', category: 'builtin' },
  { shortcut: 'hs', expands: 'has', category: 'builtin' },
  { shortcut: 'plk', expands: 'pluck', category: 'builtin' },
  { shortcut: 'grpBy', expands: 'groupBy', category: 'builtin' },
  { shortcut: 'srtBy', expands: 'sortBy', category: 'builtin' },
  { shortcut: 'flr', expands: 'floor', category: 'builtin' },
  { shortcut: 'cl', expands: 'ceil', category: 'builtin' },
  { shortcut: 'rnd', expands: 'round', category: 'builtin' },
  { shortcut: 'spl', expands: 'split', category: 'builtin' },
  { shortcut: 'stw', expands: 'startswith', category: 'builtin' },
  { shortcut: 'edw', expands: 'endswith', category: 'builtin' },
  { shortcut: 'ltrm', expands: 'ltrimstr', category: 'builtin' },
  { shortcut: 'rtrm', expands: 'rtrimstr', category: 'builtin' },
  { shortcut: 'tstr', expands: 'tostring', category: 'builtin' },
  { shortcut: 'tnum', expands: 'tonumber', category: 'builtin' },
  { shortcut: 'typ', expands: 'type', category: 'builtin' },
  { shortcut: 'cnt', expands: 'count', category: 'builtin' },
  { shortcut: 'emp', expands: 'isEmpty', category: 'builtin' },
  { shortcut: 'nil', expands: 'isNil', category: 'builtin' },
  { shortcut: 'ctns', expands: 'contains', category: 'builtin' },
  { shortcut: 'pth', expands: 'path', category: 'builtin' },
  { shortcut: 'gpth', expands: 'getpath', category: 'builtin' },
  { shortcut: 'spth', expands: 'setpath', category: 'builtin' },
  { shortcut: 'rec', expands: 'recurse', category: 'builtin' },
  { shortcut: 'sel', expands: 'select', category: 'builtin' },
  { shortcut: 'dbg', expands: 'debug', category: 'builtin' },
  { shortcut: 'rng', expands: 'range', category: 'builtin' },
]

export const SHORTCUTS: ShortcutEntry[] = [
  ...ARRAY_METHOD_SHORTCUTS,
  ...BUILTIN_SHORTCUTS,
]
