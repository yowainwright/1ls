"use client"

import { useState, useEffect } from "react"
import { Code, highlightCode } from "./code"
import type { SpotlightProps, HighlightedCode, RawCode } from "./types"

export function Spotlight({ steps }: SpotlightProps) {
  const [selectedStep, setSelectedStep] = useState(0)
  const [highlightedCodes, setHighlightedCodes] = useState<HighlightedCode[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function highlightAll() {
      setIsLoading(true)
      const codes = await Promise.all(
        steps.map(async (step) => {
          if ("code" in step.code && typeof step.code.code === "string") {
            return step.code as HighlightedCode
          }
          return await highlightCode(step.code as RawCode, "github-dark")
        })
      )
      setHighlightedCodes(codes)
      setIsLoading(false)
    }

    highlightAll()
  }, [steps])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const currentCode = highlightedCodes[selectedStep]

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <StepList
        steps={steps}
        selectedStep={selectedStep}
        onSelectStep={setSelectedStep}
      />
      <CodePanel code={currentCode} />
    </div>
  )
}

interface StepListProps {
  steps: SpotlightProps["steps"]
  selectedStep: number
  onSelectStep: (index: number) => void
}

function StepList({ steps, selectedStep, onSelectStep }: StepListProps) {
  return (
    <div className="flex flex-col gap-3 lg:w-2/5">
      {steps.map((step, index) => (
        <button
          key={index}
          onClick={() => onSelectStep(index)}
          className={`rounded-lg border p-4 text-left transition-all hover:border-primary ${
            selectedStep === index
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          <h3 className="font-semibold">{step.title}</h3>
          {step.description && (
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          )}
        </button>
      ))}
    </div>
  )
}

interface CodePanelProps {
  code: HighlightedCode
}

function CodePanel({ code }: CodePanelProps) {
  return (
    <div className="lg:sticky lg:top-4 lg:h-fit lg:w-3/5">
      <Code codeblock={code} />
    </div>
  )
}
