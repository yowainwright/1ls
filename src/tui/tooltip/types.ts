import type { Method } from "../methods/types";
import type { FuzzyMatch } from "../types";

export interface TooltipState {
  visible: boolean;
  methodHints: FuzzyMatch<Method>[];
  partialMethod: string;
  selectedHintIndex: number;
}

export interface TooltipContext {
  query: string;
  dataType: string;
  originalData: unknown;
}
