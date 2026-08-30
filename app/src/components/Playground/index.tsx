import { useState, useEffect, useRef, useCallback } from "react";
import { useMachine } from "@xstate/react";
import { Effect, Fiber } from "effect";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  PlaygroundEvent,
} from "./types";
import { FORMAT_CONFIGS, FORMATS, States, MachineEvents, PLAYGROUND_STYLES } from "./constants";
import { runEvaluation, detectFormat, minifyExpression } from "./utils";
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
    return () => {
      Effect.runFork(Fiber.interrupt(fiber));
    };
  }, [state.input, state.expression, state.format]);

  return evaluation;
}

function shouldDetectFormat(input: string, mode: PlaygroundMode, previousInput: string): boolean {
  if (mode !== "sandbox") return false;
  if (input === previousInput) return false;
  if (input === SANDBOX_PLACEHOLDER) return false;
  return Boolean(input.trim());
}

function useFormatDetection(
  input: string,
  mode: PlaygroundMode,
  currentFormat: Format,
  onFormatDetected: (format: Format) => void,
) {
  const previousInputRef = useRef<string>(input);

  useEffect(() => {
    if (!shouldDetectFormat(input, mode, previousInputRef.current)) return;
    previousInputRef.current = input;

    const fiber = Effect.runFork(
      Effect.sleep("300 millis").pipe(
        Effect.flatMap(() => Effect.sync(() => detectFormat(input))),
        Effect.tap(({ format }) =>
          Effect.sync(() => {
            if (format !== currentFormat) {
              onFormatDetected(format);
            }
          }),
        ),
        Effect.catchAll(() => Effect.void),
      ),
    );
    return () => {
      Effect.runFork(Fiber.interrupt(fiber));
    };
  }, [currentFormat, input, mode, onFormatDetected]);
}

function getHeaderContent(context: PlaygroundContext) {
  if (context.isSandbox) {
    return {
      title: "Playground",
      description: "Paste your data, write expressions, and see results in real-time",
    };
  }

  return {
    title: "Try It Live",
    description: "Edit the input data and expression to see results in real-time",
  };
}

function useShareHandler(context: PlaygroundContext, send: (event: PlaygroundEvent) => void) {
  return useCallback(() => {
    const url = getShareableUrl({
      format: context.format,
      input: context.input,
      expression: context.expression,
    });
    navigator.clipboard.writeText(url).then(() => send({ type: MachineEvents.SHARE }));
  }, [context.format, context.input, context.expression, send]);
}

export function Playground({ mode = "preset" }: PlaygroundProps) {
  const [snapshot, send] = useMachine(playgroundMachine, { input: { mode } });
  const { context } = snapshot;
  const shareStatus = snapshot.matches({ [States.READY]: States.SHARE_COPIED }) ? "copied" : "idle";
  const { output, error } = usePlaygroundEvaluation(context);
  const header = getHeaderContent(context);

  useFormatDetection(context.input, mode, context.format, (format) =>
    send({ type: MachineEvents.FORMAT_DETECTED, format }),
  );

  const handleShare = useShareHandler(context, send);

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <PlaygroundHeader
          title={header.title}
          description={header.description}
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

function InputPanel(props: InputPanelProps) {
  const suggestions = FORMAT_CONFIGS[props.format].suggestions;
  const isSandbox = props.mode === "sandbox";
  const showSuggestions = !isSandbox && suggestions.length > 0;
  const minifiedExpression = minifyExpression(props.expression);

  return (
    <div className="space-y-4">
      <FormatTabs format={props.format} onFormatChange={props.onFormatChange} />
      <InputEditor
        format={props.format}
        input={props.input}
        isSandbox={isSandbox}
        onInputChange={props.onInputChange}
      />
      <ExpressionEditor
        expression={props.expression}
        showMinifiedExpression={props.showMinifiedExpression}
        onExpressionChange={props.onExpressionChange}
        onShowMinifiedToggle={props.onShowMinifiedToggle}
      />
      {props.showMinifiedExpression && (
        <Codeblock code={minifiedExpression} language="bash" showLineNumbers={false} />
      )}
      {showSuggestions && (
        <SuggestionButtons
          expression={props.expression}
          onSuggestionClick={props.onSuggestionClick}
          suggestions={suggestions}
        />
      )}
    </div>
  );
}

function InputEditor({
  format,
  input,
  isSandbox,
  onInputChange,
}: Pick<InputPanelProps, "format" | "input" | "onInputChange"> & { isSandbox: boolean }) {
  return (
    <CodeEditor
      label="Input"
      value={input}
      onValueChange={onInputChange}
      language={FORMAT_CONFIGS[format].language}
      placeholder={isSandbox ? SANDBOX_PLACEHOLDER : undefined}
      style={{ minHeight: "240px", maxHeight: "400px", overflow: "auto" }}
    />
  );
}

function ExpressionEditor({
  expression,
  showMinifiedExpression,
  onExpressionChange,
  onShowMinifiedToggle,
}: Pick<
  InputPanelProps,
  "expression" | "showMinifiedExpression" | "onExpressionChange" | "onShowMinifiedToggle"
>) {
  return (
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
  );
}

function SuggestionButtons({
  expression,
  onSuggestionClick,
  suggestions,
}: Pick<InputPanelProps, "expression" | "onSuggestionClick"> & {
  suggestions: (typeof FORMAT_CONFIGS)[Format]["suggestions"];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-xs font-medium text-muted-foreground py-1">Try:</span>
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.expression}
          variant={expression === suggestion.expression ? "default" : "secondary"}
          size="sm"
          onClick={() => onSuggestionClick(suggestion.expression)}
          className="rounded-full"
        >
          {suggestion.label}
        </Button>
      ))}
    </div>
  );
}

function FormatTabs({ format, onFormatChange }: FormatTabsProps) {
  return (
    <div className={PLAYGROUND_STYLES.tabBar}>
      {FORMATS.map((f) => (
        <Button
          key={f}
          variant="ghost"
          size="sm"
          onClick={() => onFormatChange(f)}
          className={cn(
            PLAYGROUND_STYLES.tabBase,
            format === f ? PLAYGROUND_STYLES.tabActive : PLAYGROUND_STYLES.tabInactive,
          )}
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
          <h2 className="text-sm font-medium text-muted-foreground">Output</h2>
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
  const isCopied = shareStatus === "copied";

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
            {isCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {isCopied ? "Copied!" : "Share"}
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
