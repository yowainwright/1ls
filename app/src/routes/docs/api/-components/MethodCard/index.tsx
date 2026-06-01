import { Codeblock } from "@/components/Codeblock";
import type { MethodCardProps } from "./types";

export function MethodCard({ name, description, example, output }: MethodCardProps) {
  const code = output ? `${example}\n# Output: ${output}` : example;

  return (
    <article className="space-y-3">
      <header>
        <h3 className="font-mono text-lg font-semibold text-primary">.{name}()</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <Codeblock code={code} language="bash" />
    </article>
  );
}
