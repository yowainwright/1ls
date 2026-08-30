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
  const hasInlineValue = arg.includes("=");
  if (!isKnownFlag) return false;

  return !hasInlineValue;
};

export const findReadFileCommandIndex = (args: string[]): number =>
  READ_FILE_COMMANDS.reduce((foundIndex, command) => {
    const hasFoundCommand = foundIndex !== -1;
    if (hasFoundCommand) return foundIndex;

    return args.indexOf(command);
  }, -1);

const findExpressionCandidate = (args: string[], commandIndex: number): string | undefined => {
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

  return candidate;
};

const readCommandFilePath = (args: string[], commandIndex: number): string => {
  const filePath = args[commandIndex + 1];
  if (filePath) return filePath;

  throw new Error("Missing file path for readFile command");
};

export const resolveReadFileInvocation = (args: string[]): ReadFileInvocation => {
  const commandIndex = findReadFileCommandIndex(args);
  if (commandIndex === -1) throw new Error("Missing readFile command");

  const filePath = readCommandFilePath(args, commandIndex);
  const candidate = findExpressionCandidate(args, commandIndex);
  const isExplicitExpression = Boolean(candidate && !candidate.startsWith("-"));
  const expression = isExplicitExpression ? candidate! : ".";

  return { filePath, expression, hasExplicitExpression: isExplicitExpression };
};
