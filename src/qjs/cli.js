import * as std from "std";
import { runCli } from "./shared.js";

const readFile = (path) => {
  try {
    return std.loadFile(path);
  } catch {
    return null;
  }
};

const writeStdout = (message) => {
  if (message === undefined) return;
  std.out.puts(`${message}\n`);
};

const writeStderr = (message) => {
  if (message === undefined) return;
  std.err.puts(`${message}\n`);
};

function main() {
  const result = runCli(scriptArgs.slice(1), {
    readFile,
    readStdin: () => std.in.readAsString(),
  });

  writeStdout(result.stdout);
  writeStderr(result.stderr);

  if (result.exitCode !== 0) {
    std.exit(result.exitCode);
  }
}

main();
