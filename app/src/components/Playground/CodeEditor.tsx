import { useCallback } from "react";
import { setup, fromPromise, assign, createActor } from "xstate";
import { useSelector } from "@xstate/react";
import { Effect } from "effect";
import EditorModule from "react-simple-code-editor";
import { CodeCard, CopyButton, getHighlighter, THEME, LANGUAGES } from "@/components/Codeblock";
import type { CodeHighlighter } from "@/components/Codeblock";
import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

const Editor = (EditorModule as { default?: typeof EditorModule }).default || EditorModule;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const highlighterMachine = setup({
  types: {} as { context: { highlighter: CodeHighlighter | null } },
  actors: { loader: fromPromise((): Promise<CodeHighlighter> => getHighlighter()) },
}).createMachine({
  id: "highlighter",
  context: { highlighter: null },
  initial: "loading",
  states: {
    loading: {
      invoke: {
        src: "loader",
        onDone: {
          target: "ready",
          actions: assign({ highlighter: ({ event }) => event.output }),
        },
        onError: "failed",
      },
    },
    ready: {},
    failed: {},
  },
});

const highlighterActor = createActor(highlighterMachine).start();

function doHighlight(highlighter: CodeHighlighter | null, code: string, language: string): string {
  if (!highlighter || !code) return escapeHtml(code);
  const lang = language === "csv" || language === "text" ? "txt" : language;
  const validLang = LANGUAGES.includes(lang as (typeof LANGUAGES)[number]) ? lang : "txt";
  return Effect.runSync(
    Effect.try(() => highlighter.codeToHtml(code, { lang: validLang, theme: THEME })).pipe(
      Effect.map((html) => html.match(/<code[^>]*>([\s\S]*?)<\/code>/)?.[1] ?? escapeHtml(code)),
      Effect.catchAll(() => Effect.succeed(escapeHtml(code))),
    ),
  );
}

export interface CodeEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  language: string;
  label: string;
  placeholder?: string;
  style?: CSSProperties;
  footer?: ReactNode;
  showCopy?: boolean;
  className?: string;
}

export function CodeEditor({
  value,
  onValueChange,
  language,
  label,
  placeholder,
  style,
  footer,
  showCopy = false,
  className,
}: CodeEditorProps) {
  const highlighter = useSelector(highlighterActor, (s) => s.context.highlighter);

  const highlightFn = useCallback(
    (code: string) => doHighlight(highlighter, code, language),
    [highlighter, language],
  );

  return (
    <CodeCard className={cn("rounded-xl shadow-md relative", className)}>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      {showCopy && <CopyButton code={value} className="top-12 right-3" />}
      <Editor
        value={value}
        onValueChange={onValueChange}
        highlight={highlightFn}
        padding={16}
        placeholder={placeholder}
        className="font-mono text-sm [&_.shiki]:!bg-transparent [&_.line]:block"
        style={{ backgroundColor: "transparent", ...style }}
        textareaClassName="focus:outline-none"
      />
      {footer && <div className="border-t border-border/10 px-4 py-3">{footer}</div>}
    </CodeCard>
  );
}
