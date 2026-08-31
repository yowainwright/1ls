const parseNDJSONLine = (line: string): unknown => {
  try {
    return JSON.parse(line);
  } catch {
    return line;
  }
};

export function parseNDJSON(input: string): unknown[] {
  const lines = input.trim().split("\n");
  const nonEmptyLines = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  const values: unknown[] = [];

  for (let index = 0; index < nonEmptyLines.length; index++) {
    values[index] = parseNDJSONLine(nonEmptyLines[index]);
  }

  return values;
}
