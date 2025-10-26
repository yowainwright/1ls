import { stripJSComments } from "./javascript";

let transpilerInstance: Bun.Transpiler | null = null;

function getTranspiler(): Bun.Transpiler {
  const hasInstance = transpilerInstance !== null;

  if (hasInstance) {
    return transpilerInstance as Bun.Transpiler;
  }

  transpilerInstance = new Bun.Transpiler({
    loader: "ts",
  });

  return transpilerInstance;
}

export function parseTypeScript(input: string): unknown {
  const withoutComments = stripJSComments(input);
  const transpiler = getTranspiler();
  const transpiled = transpiler.transformSync(withoutComments);

  const exportMatch = transpiled.match(/export\s+default\s+(.+?)(?:;|\n|$)/);
  const exportedValue = exportMatch ? exportMatch[1] : null;
  const hasExport = exportedValue !== null;

  if (!hasExport) {
    return null;
  }

  const exportIndex = transpiled.indexOf("export default");
  const codeBeforeExport = transpiled.substring(0, exportIndex);
  const fullCode = `${codeBeforeExport}\n(${exportedValue})`;

  return eval(fullCode);
}
