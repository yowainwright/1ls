import { navigateJson } from "../navigator";
import { getMethodsForType, type Method } from "../methods";
import { fuzzySearch } from "../fuzzy";
import type { State, ExpressionBuilder, ArrowFnContext } from "../types";
import {
  needsArrowFn,
  getParamName,
  getParamType,
  getArraySampleValue,
  replaceLastOccurrence,
  replaceTemplateWithExpression,
  buildArrowExpression,
} from "./utils";

export const enterBuildMode = (state: State): State => {
  const hasMatches = state.matches.length > 0;
  const hasValidIndex = state.selectedIndex >= 0 && state.selectedIndex < state.matches.length;

  if (!hasMatches || !hasValidIndex) {
    return state;
  }

  const selected = state.matches[state.selectedIndex].item;

  const builder: ExpressionBuilder = {
    basePath: selected.path,
    baseValue: selected.value,
    baseType: selected.type,
    expression: selected.path,
    currentMethod: null,
    arrowFnContext: null,
  };

  const methods = getMethodsForType(selected.type);
  const methodMatches = fuzzySearch(methods, "", (method: Method) => method.signature);

  return Object.assign({}, state, {
    mode: "build" as const,
    builder,
    query: "",
    selectedIndex: 0,
    methodMatches,
  });
};

export const exitBuildMode = (state: State): State =>
  Object.assign({}, state, {
    mode: "explore" as const,
    builder: null,
    selectedIndex: 0,
  });

export const updateBuildQuery = (state: State, query: string): State => {
  if (!state.builder) return state;

  const methods = getMethodsForType(state.builder.baseType);
  const methodMatches = fuzzySearch(methods, query, (method: Method) => method.signature);

  return Object.assign({}, state, {
    query,
    methodMatches,
    selectedIndex: 0,
  });
};

export const updateArrowFnQuery = (state: State, query: string): State => {
  if (!state.builder?.arrowFnContext) return state;

  const context = state.builder.arrowFnContext;
  const propertyMatches = fuzzySearch(context.paramPaths, query, (path) => path.path);

  return Object.assign({}, state, {
    query,
    propertyMatches,
    selectedIndex: 0,
  });
};

export const selectMethod = (state: State, methodIndex: number): State => {
  if (!state.builder) return state;

  const builder = state.builder;
  const hasInvalidIndex = methodIndex < 0 || methodIndex >= state.methodMatches.length;
  if (hasInvalidIndex) return state;

  const method = state.methodMatches[methodIndex].item;
  const template = method.template || "";

  if (needsArrowFn(template)) {
    const isArrayMethod = builder.baseType === "Array";
    const paramValue = isArrayMethod ? getArraySampleValue(builder.baseValue) : builder.baseValue;

    const arrowFnContext: ArrowFnContext = {
      paramName: getParamName(template),
      paramType: getParamType(paramValue),
      paramValue,
      paramPaths: navigateJson(paramValue),
      expression: "",
    };

    const propertyMatches = fuzzySearch(arrowFnContext.paramPaths, "", (path) => path.path);

    const newBuilder = Object.assign({}, builder, {
      currentMethod: method,
      arrowFnContext,
      expression: builder.expression + template,
    });

    return Object.assign({}, state, {
      mode: "build-arrow-fn" as const,
      builder: newBuilder,
      query: "",
      selectedIndex: 0,
      propertyMatches,
    });
  }

  const newBuilder = Object.assign({}, builder, {
    expression: builder.expression + template,
    currentMethod: method,
  });

  return Object.assign({}, state, {
    builder: newBuilder,
  });
};

export const updateArrowFnExpression = (state: State, pathIndex: number): State => {
  if (!state.builder?.arrowFnContext) return state;

  const hasInvalidIndex = pathIndex < 0 || pathIndex >= state.propertyMatches.length;
  if (hasInvalidIndex) return state;

  const builder = state.builder;
  const context = builder.arrowFnContext;
  if (!context) return state;

  const selectedPath = state.propertyMatches[pathIndex].item;

  const newContext = Object.assign({}, context, {
    expression: buildArrowExpression(selectedPath.path, context.paramName),
  });

  const newBuilder = Object.assign({}, builder, {
    arrowFnContext: newContext,
  });

  return Object.assign({}, state, {
    builder: newBuilder,
  });
};

export const completeArrowFn = (state: State): State => {
  if (!state.builder?.arrowFnContext) return state;

  const builder = state.builder;
  const context = builder.arrowFnContext;
  const hasValidContext = context && context.expression;
  const method = builder.currentMethod;
  const template = method?.template || "";
  if (!hasValidContext || !template) return state;

  const finalExpression = replaceTemplateWithExpression(
    builder.expression,
    template,
    context.expression,
  );

  const newBuilder = Object.assign({}, builder, {
    expression: finalExpression,
    arrowFnContext: null,
  });

  return Object.assign({}, state, {
    mode: "build" as const,
    builder: newBuilder,
    query: "",
    selectedIndex: 0,
  });
};

export const cancelArrowFn = (state: State): State => {
  if (!state.builder) return state;

  const builder = state.builder;
  const template = builder.currentMethod?.template || "";
  if (!template) return state;

  const newBuilder = Object.assign({}, builder, {
    expression: replaceLastOccurrence(builder.expression, template, ""),
    arrowFnContext: null,
  });

  return Object.assign({}, state, {
    mode: "build" as const,
    builder: newBuilder,
  });
};

const findLastTopLevelMethodDot = (expression: string, startIndex: number): number => {
  let lastDotIndex = -1;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let quote: string | null = null;
  let isEscaped = false;

  for (let i = startIndex; i < expression.length; i++) {
    const char = expression[i];

    if (quote) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "(") {
      parenDepth++;
      continue;
    }
    if (char === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (char === "[") {
      bracketDepth++;
      continue;
    }
    if (char === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (char === "{") {
      braceDepth++;
      continue;
    }
    if (char === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    const isTopLevel = parenDepth === 0 && bracketDepth === 0 && braceDepth === 0;
    if (char === "." && isTopLevel) {
      lastDotIndex = i;
    }
  }

  return lastDotIndex;
};

export const undoLastSegment = (state: State): State => {
  if (!state.builder) return state;

  const builder = state.builder;
  const expression = builder.expression;

  if (expression === builder.basePath) {
    return exitBuildMode(state);
  }

  const lastDotIndex = findLastTopLevelMethodDot(expression, builder.basePath.length);
  if (lastDotIndex === -1) {
    return exitBuildMode(state);
  }

  const newExpression = expression.substring(0, lastDotIndex);

  if (!newExpression || newExpression === builder.basePath) {
    return exitBuildMode(state);
  }

  const newBuilder = Object.assign({}, builder, {
    expression: newExpression,
    currentMethod: null,
    arrowFnContext: null,
  });

  const methods = getMethodsForType(builder.baseType);
  const methodMatches = fuzzySearch(methods, "", (method: Method) => method.signature);

  return Object.assign({}, state, {
    builder: newBuilder,
    methodMatches,
    query: "",
    selectedIndex: 0,
  });
};
