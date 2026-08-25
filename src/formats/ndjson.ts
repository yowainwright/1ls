export function parseNDJSON(input: string): unknown[] {
  const lines = input.trim().split("\n");
  const nonEmptyLines = lines.map((line) => line.trim()).filter((line) => line.length > 0);

  return nonEmptyLines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return line;
    }
  });
}
