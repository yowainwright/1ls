export interface TooltipDemoProps {
  className?: string
}

export interface MethodHint {
  signature: string
  description: string
  isBuiltin?: boolean
  isData?: boolean
}

export interface StepDescription {
  title: string
  text: string
}

export interface DemoStep {
  triggerAt: number
  charEnd: number
  hints: MethodHint[]
  selectedHint: number
  description: StepDescription
  result?: string
}
