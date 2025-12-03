export const CLI_COMMANDS = [
  {
    title: 'Show all shortcuts',
    code: '1ls --shortcuts',
  },
  {
    title: 'Expand a shortcut',
    code: `1ls --expand ".mp(x => x * 2)"
# Output: .map(x => x * 2)`,
  },
  {
    title: 'Shorten an expression',
    code: `1ls --shorten ".map(x => x * 2)"
# Output: .mp(x => x * 2)`,
  },
]
