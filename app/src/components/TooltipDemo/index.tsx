import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { setup, assign, fromCallback } from "xstate";
import { useMachine } from "@xstate/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { CodeCard } from "@/components/Codeblock";
import { SectionHeader } from "@/components/SectionHeader";
import { EASE_CURVE } from "@/lib/styles";
import { FULL_QUERY, DEMO_STEPS, BASE_STEP_DURATION, TOOLTIP_DEMO_CONSTANTS } from "./constants";
import type { TooltipDemoProps, MethodHint, DemoContext, TerminalBodyProps, HintRowProps, FeatureDescriptionProps } from "./types";
import { getSearchTerm, filterHints } from "./utils";
export { getSearchTerm, filterHints } from "./utils";

const { styles, text } = TOOLTIP_DEMO_CONSTANTS;

const tooltipDemoMachine = setup({
  types: { context: {} as DemoContext, events: {} as { type: "TICK" } },
  actors: {
    ticker: fromCallback(({ sendBack }) => {
      const id = setInterval(() => sendBack({ type: "TICK" }), 50);
      return () => clearInterval(id);
    }),
  },
}).createMachine({
  id: "tooltipDemo",
  context: () => ({ stepIndex: 0, typedChars: 0, progress: 0, lastTime: Date.now() }),
  initial: "running",
  states: {
    running: {
      invoke: { src: "ticker" },
      on: {
        TICK: {
          actions: assign(({ context }) => {
            const now = Date.now();
            const elapsed = Math.min(now - context.lastTime, 100); // cap large gaps (tab blur etc)
            const progress = context.progress + elapsed;
            const currentStep = DEMO_STEPS[context.stepIndex];
            const prevCharEnd = context.stepIndex > 0 ? DEMO_STEPS[context.stepIndex - 1].charEnd : 0;
            const typingProgress = Math.min(progress / BASE_STEP_DURATION, 1);
            const newTypedChars = prevCharEnd + Math.floor(typingProgress * (currentStep.charEnd - prevCharEnd));
            return progress < BASE_STEP_DURATION
              ? { ...context, typedChars: newTypedChars, progress, lastTime: now }
              : { ...context, typedChars: currentStep.charEnd, progress: BASE_STEP_DURATION, lastTime: now };
          }),
        },
      },
      always: {
        guard: ({ context }) => context.progress >= BASE_STEP_DURATION,
        target: "paused",
      },
    },
    paused: {
      after: {
        1500: {
          actions: assign(({ context }) => {
            const nextIndex = (context.stepIndex + 1) % DEMO_STEPS.length;
            return { stepIndex: nextIndex, typedChars: nextIndex === 0 ? 0 : context.typedChars, progress: 0, lastTime: Date.now() };
          }),
          target: "running",
        },
      },
    },
  },
});


export function TooltipDemo({ className = "" }: TooltipDemoProps) {
  const [snapshot] = useMachine(tooltipDemoMachine);
  const { stepIndex, typedChars } = snapshot.context;

  const currentStep = DEMO_STEPS[stepIndex];
  const displayedQuery = FULL_QUERY.slice(0, typedChars);
  const isTypingComplete = typedChars >= currentStep.charEnd;

  const searchTerm = useMemo(
    () => typedChars < currentStep.triggerAt ? "" : getSearchTerm(displayedQuery, currentStep.triggerAt),
    [displayedQuery, typedChars, currentStep.triggerAt],
  );

  const filteredHints = useMemo(() => filterHints(currentStep.hints, searchTerm), [currentStep.hints, searchTerm]);
  const showTooltip = typedChars >= currentStep.triggerAt && filteredHints.length > 0;

  return (
    <section className={`${styles.section} ${className}`}>
      <div className={styles.container}>
        <SectionHeader title={text.sectionTitle} description={text.sectionDescription} />
        <motion.div
          className="mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE_CURVE }}
        >
          <div className={styles.grid}>
            <CodeCard variant="dark">
              <TerminalHeader />
              <TerminalBody
                displayedQuery={displayedQuery}
                hints={filteredHints}
                stepIndex={stepIndex}
                result={currentStep.result}
                isTypingComplete={isTypingComplete}
                showTooltip={showTooltip}
                searchTerm={searchTerm}
              />
            </CodeCard>
            <FeatureDescription
              title={currentStep.description.title}
              text={currentStep.description.text}
              stepIndex={stepIndex}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TerminalHeader() {
  return (
    <div className={styles.terminalHeader}>
      <span className={styles.terminalHeaderText}>{text.terminalHeaderLabel}</span>
    </div>
  );
}

function TerminalBody({ displayedQuery, hints, stepIndex, result, isTypingComplete, showTooltip, searchTerm }: TerminalBodyProps) {
  const showResult = isTypingComplete && result;
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState(0);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setTooltipLeft(el.offsetWidth);
    const observer = new ResizeObserver(() => setTooltipLeft(el.offsetWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [displayedQuery]);

  return (
    <div className={styles.terminalBody}>
      <div className={styles.terminalRow}>
        <span className={styles.terminalPrompt}>❯</span>
        <div className={styles.terminalInput}>
          <span ref={textRef} className={styles.terminalText}>{displayedQuery}</span>
          <motion.span
            className={styles.terminalCursor}
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                key={`tooltip-${stepIndex}`}
                className={styles.tooltip}
                style={{ left: Math.max(0, tooltipLeft - 10) }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {hints.map((hint, index) => (
                  <HintRow key={hint.signature} hint={hint} isSelected={index === 0} searchTerm={searchTerm} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {showResult && (
          <motion.div
            key={`result-${stepIndex}`}
            className={styles.tooltipResult}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <pre className={styles.tooltipResultPre}>{result}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function highlightMatches(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm) return text;
  const match = text.match(/^(\.?)(\w+)(.*)$/);
  if (!match) return text;
  const [, dot, name, rest] = match;
  const matchLength = searchTerm.length;
  if (!name.toLowerCase().startsWith(searchTerm.toLowerCase())) return text;
  return (
    <>
      {dot}
      <span className={styles.highlightMatch}>{name.slice(0, matchLength)}</span>
      {name.slice(matchLength)}
      {rest}
    </>
  );
}

function HintRow({ hint, isSelected, searchTerm }: HintRowProps) {
  return (
    <div className={`${styles.hintRow} ${isSelected ? styles.hintRowSelected : ""}`}>
      <ChevronRight className={`${styles.hintChevron} ${isSelected ? styles.hintChevronSelected : styles.hintChevronUnselected}`} />
      <span className={isSelected ? styles.hintSignatureSelected : styles.hintSignatureUnselected}>
        {highlightMatches(hint.signature, searchTerm)}
      </span>
      <span className={styles.hintDescription}>{hint.description}</span>
      {hint.isBuiltin && <span className={styles.hintBuiltinBadge}>{TOOLTIP_DEMO_CONSTANTS.text.hintBuiltin}</span>}
      {hint.isData && <span className={styles.hintDataBadge}>{TOOLTIP_DEMO_CONSTANTS.text.hintData}</span>}
    </div>
  );
}

function FeatureDescription({ title, text: descText, stepIndex }: FeatureDescriptionProps) {
  return (
    <article className={styles.featureDescription}>
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className={styles.featureTitle}>{title}</h3>
          <p className={styles.featureText}>{descText}</p>
        </motion.div>
      </AnimatePresence>
    </article>
  );
}

export default TooltipDemo;
