export function stripJSComments(input: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let stringDelimiter = "";

  while (i < input.length) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (inString) {
      result += char;
      const isEscaped = char === "\\" && nextChar;
      if (isEscaped) {
        result += nextChar;
        i += 2;
        continue;
      }

      if (char === stringDelimiter) {
        inString = false;
      }
      i++;
      continue;
    }

    const isStringStart = char === '"' || char === "'" || char === "`";
    if (isStringStart) {
      inString = true;
      stringDelimiter = char;
      result += char;
      i++;
      continue;
    }

    const isSingleLineComment = char === "/" && nextChar === "/";
    if (isSingleLineComment) {
      while (i < input.length && input[i] !== "\n") {
        i++;
      }
      continue;
    }

    const isMultiLineComment = char === "/" && nextChar === "*";
    if (isMultiLineComment) {
      i += 2;
      while (i < input.length) {
        const isEnd = input[i] === "*" && input[i + 1] === "/";
        if (isEnd) {
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

export function parseJavaScript(input: string): unknown {
  const withoutComments = stripJSComments(input);

  const exportMatch = withoutComments.match(/export\s+default\s+([\s\S]+)/);
  const code = exportMatch ? exportMatch[1] : withoutComments;
  const trimmed = code.trim().replace(/;$/, "");

  return eval(`(${trimmed})`);
}
