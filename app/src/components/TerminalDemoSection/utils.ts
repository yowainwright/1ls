export function createCommandString(input: string, command: string): string {
  return `echo '${input}' | 1ls '${command}'`
}

export function createSandpackFiles(input: string, command: string) {
  const commandString = createCommandString(input, command)

  return {
    "/demo.sh": {
      code: `#!/bin/bash\n${commandString}`,
      active: true,
    },
  }
}
