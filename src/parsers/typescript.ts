import { stripJSComments } from "./javascript";

export function parseTypeScript(input: string): unknown {
  const withoutComments = stripJSComments(input);

  const transpiler = new Bun.Transpiler({
    loader: "ts",
  });

  const transpiled = transpiler.transformSync(withoutComments);

  const exportMatch = transpiled.match(/export\s+default\s+(.+?)(?:;|\n|$)/);
  const exportedValue = exportMatch ? exportMatch[1] : null;

  if (!exportedValue) {
    return null;
  }

  const codeBeforeExport = transpiled.substring(0, transpiled.indexOf("export default"));
  const fullCode = `${codeBeforeExport}\n(${exportedValue})`;

  return eval(fullCode);
}
