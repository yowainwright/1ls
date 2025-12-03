import type { MethodGroup } from './types'

export const METHOD_GROUPS: MethodGroup[] = [
  {
    type: 'Array',
    methods:
      'map, filter, reduce, find, findIndex, some, every, sort, reverse, slice, concat, join, flat, flatMap, length',
  },
  {
    type: 'String',
    methods:
      'toUpperCase, toLowerCase, trim, trimStart, trimEnd, split, replace, replaceAll, substring, slice, startsWith, endsWith, includes, match, length',
  },
  {
    type: 'Object',
    methods: '{keys}, {values}, {entries}, {length}',
  },
  {
    type: 'Number',
    methods: 'toFixed, toString',
  },
]
