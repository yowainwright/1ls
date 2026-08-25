export interface ReadFileInvocation {
  filePath: string;
  expression: string;
  hasExplicitExpression: boolean;
}

const READ_FILE_COMMANDS = ["rf", "readFile"] as const;
const FLAGS_WITH_VALUES = new Set([
  "--format",
  "--input-format",
  "-if",
  "--find",
  "-f",
  "--grep",
  "-g",
  "--list",
  "-l",
  "--ext",
  "--max-depth",
  "--shorten",
  "--expand",
]);

const hasSeparateFlagValue = (arg: string): boolean => {
  const isKnownFlag = FLAGS_WITH_VALUES.has(arg);
  const hasNoInlineValue = !arg.includes("=");
  return isKnownFlag && hasNoInlineValue;
};

export const findReadFileCommandIndex = (args: string[]): number =>
  READ_FILE_COMMANDS.reduce((foundIndex, command) => {
    if (foundIndex !== -1) {
      return foundIndex;
    }

    return args.indexOf(command);
  }, -1);

export const resolveReadFileInvocation = (args: string[]): ReadFileInvocation => {
  const commandIndex = findReadFileCommandIndex(args);
  if (commandIndex === -1) {
    throw new Error("Missing readFile command");
  }

  const filePath = args[commandIndex + 1];
  if (!filePath) {
    throw new Error("Missing file path for readFile command");
  }

  let candidate: string | undefined;

  for (let i = commandIndex + 2; i < args.length; i++) {
    const arg = args[i];
    if (!arg) {
      continue;
    }

    if (arg.startsWith("-")) {
      if (hasSeparateFlagValue(arg)) i++;
      continue;
    }

    candidate = arg;
    break;
  }

  const hasExplicitExpression = Boolean(candidate && !candidate.startsWith("-"));
  const expression = hasExplicitExpression ? candidate! : ".";

  return { filePath, expression, hasExplicitExpression };
};
