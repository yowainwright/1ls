import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { SectionHeader } from "@/components/SectionHeader"
import { EASE_CURVE } from "@/lib/styles"
import { FULL_QUERY, DEMO_STEPS, BASE_STEP_DURATION } from "./constants"
import type { TooltipDemoProps, MethodHint } from "./types"

function getSearchTerm(query: string, triggerAt: number): string {
  // Get the text from trigger position to current cursor
  const textAfterTrigger = query.slice(triggerAt)
  // Find the last dot and get what's after it for filtering
  const lastDotIndex = query.lastIndexOf(".")
  if (lastDotIndex === -1) return textAfterTrigger
  return query.slice(lastDotIndex + 1).toLowerCase()
}

function filterHints(hints: MethodHint[], searchTerm: string): MethodHint[] {
  if (!searchTerm) return hints
  return hints.filter((hint) => {
    // Extract the method/property name from signature (e.g., ".map(x => ...)" -> "map")
    const match = hint.signature.match(/^\.?(\w+)/)
    const name = match ? match[1].toLowerCase() : hint.signature.toLowerCase()
    return name.startsWith(searchTerm)
  })
}

export function TooltipDemo({ className = "" }: TooltipDemoProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [typedChars, setTypedChars] = useState(0)
  const progressRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(Date.now())

  const currentStep = DEMO_STEPS[stepIndex]
  const prevCharEnd = stepIndex > 0 ? DEMO_STEPS[stepIndex - 1].charEnd : 0
  const targetCharEnd = currentStep.charEnd
  const displayedQuery = FULL_QUERY.slice(0, typedChars)
  const isTypingComplete = typedChars >= targetCharEnd

  const searchTerm = useMemo(() => {
    if (typedChars < currentStep.triggerAt) return ""
    return getSearchTerm(displayedQuery, currentStep.triggerAt)
  }, [displayedQuery, typedChars, currentStep.triggerAt])

  const filteredHints = useMemo(() => {
    return filterHints(currentStep.hints, searchTerm)
  }, [currentStep.hints, searchTerm])

  const showTooltip = typedChars >= currentStep.triggerAt && filteredHints.length > 0

  useEffect(() => {
    const animate = () => {
      const now = Date.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now

      progressRef.current += delta

      // Type from previous step's end to current step's end
      const charsToType = targetCharEnd - prevCharEnd
      // Use full duration for typing, no pause at end
      const typingProgress = Math.min(progressRef.current / BASE_STEP_DURATION, 1)
      const newTypedChars = prevCharEnd + Math.floor(typingProgress * charsToType)
      setTypedChars(newTypedChars)

      if (progressRef.current >= BASE_STEP_DURATION) {
        const nextIndex = (stepIndex + 1) % DEMO_STEPS.length
        if (nextIndex === 0) {
          setTypedChars(0)
        }
        setStepIndex(nextIndex)
        progressRef.current = 0
      }
    }

    const intervalId = setInterval(animate, 50)
    return () => clearInterval(intervalId)
  }, [stepIndex, prevCharEnd, targetCharEnd])

  return (
    <section className={`px-4 py-16 md:py-24 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <SectionHeader
          title="Smart Tooltips in Action"
          description="Watch how 1ls provides intelligent hints as you type"
        />
        <motion.div
          className="mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE_CURVE }}
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="rounded-lg border border-border/10 bg-[#282a36] overflow-hidden">
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
            </div>

            <FeatureDescription
              title={currentStep.description.title}
              text={currentStep.description.text}
              stepIndex={stepIndex}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function TerminalHeader() {
  return (
    <div className="border-b border-white/10 bg-white/5 px-4 py-2">
      <span className="text-sm font-medium text-muted-foreground">Interactive Mode</span>
    </div>
  )
}

interface TerminalBodyProps {
  displayedQuery: string
  hints: MethodHint[]
  stepIndex: number
  result?: string
  isTypingComplete: boolean
  showTooltip: boolean
  searchTerm: string
}

function TerminalBody({ displayedQuery, hints, stepIndex, result, isTypingComplete, showTooltip, searchTerm }: TerminalBodyProps) {
  const showResult = isTypingComplete && result
  const textRef = useRef<HTMLSpanElement>(null)
  const [tooltipLeft, setTooltipLeft] = useState(0)

  useEffect(() => {
    if (textRef.current) {
      setTooltipLeft(textRef.current.offsetWidth)
    }
  }, [displayedQuery])

  return (
    <div className="p-6 font-mono text-sm min-h-[200px]">
      <div className="flex items-start gap-2">
        <span className="text-[#50fa7b] shrink-0">❯</span>
        <div className="flex-1 relative">
          <span ref={textRef} className="text-[#f8f8f2]">{displayedQuery}</span>
          <motion.span
            className="inline-block w-2 h-4 bg-[#f8f8f2] ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />

          <AnimatePresence>
            {showTooltip && (
              <motion.div
                key={`tooltip-${stepIndex}`}
                className="absolute top-full mt-2 bg-[#44475a] border border-white/10 rounded-md shadow-lg overflow-hidden z-10 min-w-[280px]"
                style={{ left: Math.max(0, tooltipLeft - 10) }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {hints.map((hint, index) => (
                  <HintRow
                    key={hint.signature}
                    hint={hint}
                    isSelected={index === 0}
                    searchTerm={searchTerm}
                  />
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
            className="mt-4 pl-5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <pre className="text-[#8be9fd] text-sm leading-relaxed">{result}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface HintRowProps {
  hint: MethodHint
  isSelected: boolean
  searchTerm: string
}

function highlightMatches(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm) return text

  // Extract the method/property name part (e.g., ".map" from ".map(x => ...)")
  const match = text.match(/^(\.?)(\w+)(.*)$/)
  if (!match) return text

  const [, dot, name, rest] = match
  const lowerName = name.toLowerCase()
  const lowerSearch = searchTerm.toLowerCase()

  // Highlight matching prefix characters
  const matchLength = lowerSearch.length
  if (lowerName.startsWith(lowerSearch)) {
    return (
      <>
        {dot}
        <span className="text-[#50fa7b]">{name.slice(0, matchLength)}</span>
        {name.slice(matchLength)}
        {rest}
      </>
    )
  }

  return text
}

function HintRow({ hint, isSelected, searchTerm }: HintRowProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 text-xs ${
        isSelected ? "bg-[#6272a4]/50" : ""
      }`}
    >
      <ChevronRight className={`h-3 w-3 shrink-0 ${isSelected ? "text-[#50fa7b]" : "text-transparent"}`} />
      <span className={isSelected ? "text-[#f8f8f2] font-medium" : "text-[#f8f8f2]/70"}>
        {highlightMatches(hint.signature, searchTerm)}
      </span>
      <span className="text-[#6272a4] ml-auto">
        {hint.description}
      </span>
      {hint.isBuiltin && (
        <span className="text-[#ffb86c] text-[10px]">[builtin]</span>
      )}
      {hint.isData && (
        <span className="text-[#8be9fd] text-[10px]">[data]</span>
      )}
    </div>
  )
}

interface FeatureDescriptionProps {
  title: string
  text: string
  stepIndex: number
}

function FeatureDescription({ title, text, stepIndex }: FeatureDescriptionProps) {
  return (
    <div className="lg:py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-2xl font-semibold text-foreground mb-4">{title}</h3>
          <p className="text-lg text-muted-foreground leading-relaxed">{text}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default TooltipDemo
