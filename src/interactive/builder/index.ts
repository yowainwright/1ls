import { navigateJson } from "../navigator";
import { getMethodsForType, type Method } from "../methods";
import { fuzzySearch } from "../fuzzy";
import type { State, ExpressionBuilder, ArrowFnContext } from "../types";
import {
  needsArrowFn,
  getParamName,
  getParamType,
  getArraySampleValue,
  replaceTemplateWithExpression,
  buildArrowExpression,
} from "./utils";

export const enterBuildMode = (state: State): State => {
  const hasMatches = state.matches.length > 0;
  const hasValidIndex =
    state.selectedIndex >= 0 && state.selectedIndex < state.matches.length;

  if (!hasMatches || !hasValidIndex) {
    return state;
  }

  const selected = state.matches[state.selectedIndex].item;

  const builder: ExpressionBuilder = {
    basePath: selected.path,
    baseValue: selected.value,
    baseType: selected.type,
    expression: selected.path,
    currentMethodIndex: 0,
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

  const builder = state.builder;
  const methods = getMethodsForType(builder.baseType);
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
    const paramValue = isArrayMethod
      ? getArraySampleValue(builder.baseValue)
      : builder.baseValue;

    const arrowFnContext: ArrowFnContext = {
      paramName: getParamName(template),
      paramType: getParamType(paramValue),
      paramValue,
      paramPaths: navigateJson(paramValue),
      expression: "",
    };

    const propertyMatches = fuzzySearch(arrowFnContext.paramPaths, "", (path) => path.path);

    const newBuilder = Object.assign({}, builder, {
      currentMethodIndex: methodIndex,
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
    currentMethodIndex: methodIndex,
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
  if (!hasValidContext) return state;

  const methods = getMethodsForType(builder.baseType);
  const method = methods[builder.currentMethodIndex];
  const template = method.template || "";

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
  const methods = getMethodsForType(builder.baseType);
  const method = methods[builder.currentMethodIndex];
  const template = method.template || "";

  const newBuilder = Object.assign({}, builder, {
    expression: builder.expression.replace(template, ""),
    arrowFnContext: null,
  });

  return Object.assign({}, state, {
    mode: "build" as const,
    builder: newBuilder,
  });
};

export const undoLastSegment = (state: State): State => {
  if (!state.builder) return state;

  const builder = state.builder;
  const expression = builder.expression;

  const lastDotIndex = expression.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return exitBuildMode(state);
  }

  const lastOpenParenIndex = expression.lastIndexOf("(");
  const shouldRemoveMethod = lastOpenParenIndex > lastDotIndex;

  const newExpression = shouldRemoveMethod
    ? expression.substring(0, lastDotIndex)
    : expression;

  if (newExpression === builder.basePath) {
    return exitBuildMode(state);
  }

  const newBuilder = Object.assign({}, builder, {
    expression: newExpression,
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
