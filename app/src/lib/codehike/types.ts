import type { AnnotationHandler, HighlightedCode, RawCode } from "codehike/code"

export interface CodeHikeProps {
  codeblock: HighlightedCode
  handlers?: AnnotationHandler[]
  theme?: string
  className?: string
  id?: string
}

export interface CodeProps {
  codeblock: HighlightedCode
  handlers?: AnnotationHandler[]
}

export interface Step {
  code: HighlightedCode | RawCode
  title: string
  description?: string
}

export interface SpotlightProps {
  steps: Step[]
}

export type { AnnotationHandler, HighlightedCode, RawCode }
