export interface DemoContext {
  stepIndex: number;
  typedChars: number;
  progress: number;
  lastTime: number;
}

export interface TerminalBodyProps {
  displayedQuery: string;
  hints: MethodHint[];
  stepIndex: number;
  result?: string;
  isTypingComplete: boolean;
  showTooltip: boolean;
  searchTerm: string;
}

export interface HintRowProps {
  hint: MethodHint;
  isSelected: boolean;
  searchTerm: string;
}

export interface FeatureDescriptionProps {
  title: string;
  text: string;
  stepIndex: number;
}

export interface TooltipDemoProps {
  className?: string;
}

export interface MethodHint {
  signature: string;
  description: string;
  isBuiltin?: boolean;
  isData?: boolean;
}

export interface StepDescription {
  title: string;
  text: string;
}

export interface DemoStep {
  triggerAt: number;
  charEnd: number;
  hints: MethodHint[];
  selectedHint: number;
  description: StepDescription;
  result?: string;
}
