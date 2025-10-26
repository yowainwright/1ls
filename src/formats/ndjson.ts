export function parseNDJSON(input: string): unknown[] {
  const lines = input.trim().split("\n");

  return lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return line;
      }
    });
}
