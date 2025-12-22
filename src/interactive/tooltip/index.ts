import { getMethodsForType } from "../methods";
import { fuzzySearch } from "../fuzzy";
import { evaluatePreview, formatPreview } from "../preview";
import type { Method } from "../methods/types";
import type { FuzzyMatch } from "../types";
import type { TooltipState, TooltipContext } from "./types";
import { MAX_TOOLTIP_HINTS, METHOD_TRIGGER_CHAR } from "./constants";

export type { TooltipState, TooltipContext } from "./types";
export { MAX_TOOLTIP_HINTS, METHOD_TRIGGER_CHAR, METHOD_COMPLETE_CHARS } from "./constants";

const extractPartialMethod = (query: string): string | null => {
  const lastDotIndex = query.lastIndexOf(METHOD_TRIGGER_CHAR);
  const hasNoDot = lastDotIndex === -1;
  if (hasNoDot) return null;

  const afterDot = query.slice(lastDotIndex + 1);
  const isComplete = afterDot.includes("(") || afterDot.includes(")");
  if (isComplete) return null;

  return afterDot;
};

const detectDataType = (data: unknown): string => {
  if (data === null) return "null";
  if (Array.isArray(data)) return "Array";
  const type = typeof data;
  const typeMap: Record<string, string> = {
    string: "String",
    number: "Number",
    boolean: "Boolean",
    object: "Object",
  };
  return typeMap[type] || "unknown";
};

export const createTooltipState = (): TooltipState =>
  Object.assign({}, {
    visible: false,
    methodHints: [],
    partialMethod: "",
    selectedHintIndex: 0,
  });

export const updateTooltipFromQuery = (
  context: TooltipContext,
): TooltipState => {
  const partialMethod = extractPartialMethod(context.query);
  const hasNoPartial = partialMethod === null;
  if (hasNoPartial) {
    return createTooltipState();
  }

  const dataType = context.dataType || detectDataType(context.originalData);
  const methods = getMethodsForType(dataType);
  const allMatches = fuzzySearch(methods, partialMethod, (m: Method) => m.name);
  const methodHints = allMatches.slice(0, MAX_TOOLTIP_HINTS);

  const hasHints = methodHints.length > 0;

  return Object.assign({}, {
    visible: hasHints,
    methodHints,
    partialMethod,
    selectedHintIndex: 0,
  });
};

export const selectNextHint = (tooltip: TooltipState): TooltipState => {
  const hasNoHints = tooltip.methodHints.length === 0;
  if (hasNoHints) return tooltip;

  const nextIndex = (tooltip.selectedHintIndex + 1) % tooltip.methodHints.length;
  return Object.assign({}, tooltip, { selectedHintIndex: nextIndex });
};

export const selectPreviousHint = (tooltip: TooltipState): TooltipState => {
  const hasNoHints = tooltip.methodHints.length === 0;
  if (hasNoHints) return tooltip;

  const total = tooltip.methodHints.length;
  const prevIndex = (tooltip.selectedHintIndex - 1 + total) % total;
  return Object.assign({}, tooltip, { selectedHintIndex: prevIndex });
};

export const getSelectedHint = (tooltip: TooltipState): Method | null => {
  const hasNoHints = tooltip.methodHints.length === 0;
  if (hasNoHints) return null;

  const hasValidIndex =
    tooltip.selectedHintIndex >= 0 &&
    tooltip.selectedHintIndex < tooltip.methodHints.length;
  if (!hasValidIndex) return null;

  return tooltip.methodHints[tooltip.selectedHintIndex].item;
};

const COMPLETE_PROPERTY_NAMES = ["length", "keys", "values", "entries"];

export const isMethodComplete = (query: string): boolean => {
  const lastDotIndex = query.lastIndexOf(METHOD_TRIGGER_CHAR);
  const hasNoDot = lastDotIndex === -1;
  if (hasNoDot) return false;

  const afterDot = query.slice(lastDotIndex + 1);
  const hasClosingParen = afterDot.includes(")");
  const isKnownProperty = COMPLETE_PROPERTY_NAMES.includes(afterDot);

  return hasClosingParen || isKnownProperty;
};

export const getPreviewForExpression = (
  expression: string,
  data: unknown,
): { success: boolean; preview: string } => {
  const result = evaluatePreview(expression, data);
  const preview = formatPreview(result);
  return { success: result.success, preview };
};

export const formatMethodHint = (
  match: FuzzyMatch<Method>,
): { signature: string; description: string; isBuiltin: boolean } => {
  const method = match.item;
  return {
    signature: method.signature,
    description: method.description,
    isBuiltin: method.isBuiltin || false,
  };
};
