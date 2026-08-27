import { readFileSync } from "node:fs";
import { runCli } from "./shared";

const readFile = (path: string): string | null => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

const write = (message: string | undefined): void => {
  if (message !== undefined) console.log(message);
};

const result = runCli(process.argv.slice(2), {
  readFile,
  readStdin: () => readFileSync(0, "utf8"),
});

write(result.stdout);
if (result.stderr !== undefined) console.error(result.stderr);
process.exitCode = result.exitCode;
