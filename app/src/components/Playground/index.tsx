import { useState, useEffect, useRef, useCallback } from "react";
import { useMachine } from "@xstate/react";
import { Effect, Fiber } from "effect";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Codeblock, CodeCard } from "@/components/Codeblock";
import { CodeEditor } from "./CodeEditor";
import { SectionHeader } from "@/components/SectionHeader";
import type {
  Format,
  PlaygroundMode,
  PlaygroundContext,
  EvaluationState,
  PlaygroundProps,
  InputPanelProps,
  FormatTabsProps,
  OutputPanelProps,
  PlaygroundHeaderProps,
} from "./types";
import { FORMAT_CONFIGS, FORMATS, States, MachineEvents } from "./constants";
import { runEvaluation, detectFormat, minifyExpression, expandExpression } from "./utils";
import { getShareableUrl } from "./storage";
import { playgroundMachine } from "./machine";

const SANDBOX_PLACEHOLDER = "Paste your JSON, YAML, CSV, TOML, or plain text here...";

function usePlaygroundEvaluation(state: Pick<PlaygroundContext, "input" | "expression" | "format">) {
  const [evaluation, setEvaluation] = useState<EvaluationState>({ output: "", error: null });

  useEffect(() => {
    const fiber = Effect.runFork(
      Effect.sleep("100 millis").pipe(
        Effect.flatMap(() => runEvaluation(state.input, state.expression, state.format)),
        Effect.tap((result) => Effect.sync(() => setEvaluation(result))),
        Effect.catchAll(() => Effect.void),
      ),
    );
    return () => { Effect.runFork(Fiber.interrupt(fiber)); };
  }, [state.input, state.expression, state.format]);

  return evaluation;
}

function useFormatDetection(
  input: string,
  mode: PlaygroundMode,
  onFormatDetected: (format: Format) => void,
) {
  const previousInputRef = useRef<string>("");

  useEffect(() => {
    if (mode !== "sandbox" || input === previousInputRef.current || input === SANDBOX_PLACEHOLDER || !input.trim()) return;
    previousInputRef.current = input;

    const fiber = Effect.runFork(
      Effect.sleep("300 millis").pipe(
        Effect.flatMap(() => Effect.sync(() => detectFormat(input))),
        Effect.tap(({ format }) => Effect.sync(() => onFormatDetected(format))),
        Effect.catchAll(() => Effect.void),
      ),
    );
    return () => { Effect.runFork(Fiber.interrupt(fiber)); };
  }, [input, mode, onFormatDetected]);
}


export function Playground({ mode = "preset" }: PlaygroundProps) {
  const [snapshot, send] = useMachine(playgroundMachine, { input: { mode } });
  const { context } = snapshot;
  const shareStatus = snapshot.matches({ [States.READY]: States.SHARE_COPIED }) ? "copied" : "idle";

  const { output, error } = usePlaygroundEvaluation(context);

  useFormatDetection(context.input, mode, (format) =>
    send({ type: MachineEvents.FORMAT_DETECTED, format }),
  );

  const handleShare = useCallback(() => {
    const url = getShareableUrl({ format: context.format, input: context.input, expression: context.expression });
    navigator.clipboard.writeText(url).then(() => send({ type: MachineEvents.SHARE }));
  }, [context.format, context.input, context.expression, send]);

  const title = context.isSandbox ? "Playground" : "Try It Live";
  const description = context.isSandbox
    ? "Paste your data, write expressions, and see results in real-time"
    : "Edit the input data and expression to see results in real-time";

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <PlaygroundHeader
          title={title}
          description={description}
          showShare={context.isSandbox}
          shareStatus={shareStatus}
          onShare={handleShare}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <InputPanel
            mode={mode}
            format={context.format}
            input={context.input}
            expression={context.expression}
            showMinifiedExpression={context.showMinifiedExpression}
            onFormatChange={(format) => send({ type: MachineEvents.FORMAT_CHANGE, format })}
            onInputChange={(input) => send({ type: MachineEvents.INPUT_CHANGE, input })}
            onExpressionChange={(expression) => send({ type: MachineEvents.EXPRESSION_CHANGE, expression })}
            onShowMinifiedToggle={() => send({ type: MachineEvents.TOGGLE_MINIFIED })}
            onSuggestionClick={(expression) => send({ type: MachineEvents.EXPRESSION_CHANGE, expression })}
          />
          <OutputPanel output={output} error={error} />
        </div>
      </div>
    </section>
  );
}

function InputPanel({
  mode,
  format,
  input,
  expression,
  showMinifiedExpression,
  onFormatChange,
  onInputChange,
  onExpressionChange,
  onShowMinifiedToggle,
  onSuggestionClick,
}: InputPanelProps) {
  const suggestions = FORMAT_CONFIGS[format].suggestions;
  const isSandbox = mode === "sandbox";
  const showSuggestions = !isSandbox && suggestions.length > 0;
  const minifiedExpression = minifyExpression(expression);

  return (
    <div className="space-y-4">
      <FormatTabs format={format} onFormatChange={onFormatChange} />
      <CodeEditor
        label="Input"
        value={input}
        onValueChange={onInputChange}
        language={FORMAT_CONFIGS[format].language}
        placeholder={isSandbox ? SANDBOX_PLACEHOLDER : undefined}
        style={{ minHeight: "240px", maxHeight: "400px", overflow: "auto" }}
      />
      <CodeEditor
        label="Expression"
        value={expression}
        onValueChange={onExpressionChange}
        language="javascript"
        showCopy
        footer={
          <Button variant="secondary" size="sm" onClick={onShowMinifiedToggle}>
            {showMinifiedExpression ? "Hide Minified" : "Minify"}
          </Button>
        }
      />
      {showMinifiedExpression && (
        <Codeblock code={minifiedExpression} language="bash" showLineNumbers={false} />
      )}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-muted-foreground py-1">Try:</span>
          {suggestions.map((s) => (
            <Button
              key={s.expression}
              variant={expression === s.expression ? "default" : "secondary"}
              size="sm"
              onClick={() => onSuggestionClick(s.expression)}
              className="rounded-full"
            >
              {s.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function FormatTabs({ format, onFormatChange }: FormatTabsProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-border/10 bg-muted p-1 shadow-sm">
      {FORMATS.map((f) => (
        <Button
          key={f}
          variant={format === f ? "outline" : "ghost"}
          size="sm"
          onClick={() => onFormatChange(f)}
        >
          {FORMAT_CONFIGS[f].label}
        </Button>
      ))}
    </div>
  );
}

function OutputPanel({ output, error }: OutputPanelProps) {
  return (
    <div className="space-y-4">
      <div className="h-[42px]" />
      <CodeCard className="rounded-xl shadow-md">
        <div className="border-b border-white/10 bg-white/5 px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">Output</span>
        </div>
        {error ? (
          <div className="p-4 font-mono text-sm text-red-400">{error}</div>
        ) : (
          <Codeblock code={output || "// Result will appear here"} language="json" />
        )}
      </CodeCard>
    </div>
  );
}

function PlaygroundHeader({
  title,
  description,
  showShare,
  shareStatus,
  onShare,
}: PlaygroundHeaderProps) {
  return (
    <div className="mb-8">
      <SectionHeader
        title={title}
        description={description}
        className={showShare ? "mb-4" : "mb-0"}
      />
      {showShare && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={onShare}>
            {shareStatus === "copied" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {shareStatus === "copied" ? "Copied!" : "Share"}
          </Button>
        </div>
      )}
    </div>
  );
}

export { FORMAT_CONFIGS, DEFAULT_EXPRESSION, FORMATS } from "./constants";
export { runEvaluation, detectFormat, minifyExpression, expandExpression } from "./utils";
export type {
  Format,
  FormatConfig,
  PlaygroundState,
  PlaygroundMode,
  DetectionResult,
} from "./types";
