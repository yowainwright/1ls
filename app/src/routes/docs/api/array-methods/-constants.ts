import type { MethodCardProps } from '../-components/MethodCard/types'

export const ARRAY_METHODS: MethodCardProps[] = [
  {
    name: 'map',
    description: 'Transform each element in an array.',
    example: `echo '[1, 2, 3]' | 1ls '.map(x => x * 2)'`,
    output: '[2, 4, 6]',
  },
  {
    name: 'filter',
    description: 'Keep elements that match a condition.',
    example: `echo '[1, 2, 3, 4, 5]' | 1ls '.filter(x => x > 2)'`,
    output: '[3, 4, 5]',
  },
  {
    name: 'reduce',
    description: 'Reduce an array to a single value.',
    example: `echo '[1, 2, 3, 4]' | 1ls '.reduce((sum, x) => sum + x, 0)'`,
    output: '10',
  },
  {
    name: 'find',
    description: 'Find the first element matching a condition.',
    example: `echo '[{"id": 1}, {"id": 2}, {"id": 3}]' | 1ls '.find(x => x.id === 2)'`,
    output: '{"id": 2}',
  },
  {
    name: 'findIndex',
    description: 'Find the index of the first matching element.',
    example: `echo '[10, 20, 30]' | 1ls '.findIndex(x => x === 20)'`,
    output: '1',
  },
  {
    name: 'some',
    description: 'Check if any element matches a condition.',
    example: `echo '[1, 2, 3]' | 1ls '.some(x => x > 2)'`,
    output: 'true',
  },
  {
    name: 'every',
    description: 'Check if all elements match a condition.',
    example: `echo '[2, 4, 6]' | 1ls '.every(x => x % 2 === 0)'`,
    output: 'true',
  },
  {
    name: 'sort',
    description: 'Sort array elements.',
    example: `echo '[3, 1, 2]' | 1ls '.sort((a, b) => a - b)'`,
    output: '[1, 2, 3]',
  },
  {
    name: 'reverse',
    description: 'Reverse the array order.',
    example: `echo '[1, 2, 3]' | 1ls '.reverse()'`,
    output: '[3, 2, 1]',
  },
  {
    name: 'slice',
    description: 'Extract a portion of an array.',
    example: `echo '[1, 2, 3, 4, 5]' | 1ls '.slice(1, 4)'`,
    output: '[2, 3, 4]',
  },
  {
    name: 'flat',
    description: 'Flatten nested arrays.',
    example: `echo '[[1, 2], [3, 4]]' | 1ls '.flat()'`,
    output: '[1, 2, 3, 4]',
  },
  {
    name: 'flatMap',
    description: 'Map then flatten the result.',
    example: `echo '[1, 2]' | 1ls '.flatMap(x => [x, x * 2])'`,
    output: '[1, 2, 2, 4]',
  },
  {
    name: 'join',
    description: 'Join array elements into a string.',
    example: `echo '["a", "b", "c"]' | 1ls '.join("-")'`,
    output: '"a-b-c"',
  },
]
