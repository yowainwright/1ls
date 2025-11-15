import { navigateJson } from "./navigator";
import { getMethodsForType } from "./methods";
import { fuzzySearch } from "./fuzzy";
import type { State, ExpressionBuilder, ArrowFnContext, Method } from "./types";

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

  const newState = Object.assign({}, state, {
    mode: "build" as const,
    builder,
    query: "",
    selectedIndex: 0,
    methodMatches,
  });

  return newState;
};

export const exitBuildMode = (state: State): State => {
  const newState = Object.assign({}, state, {
    mode: "explore" as const,
    builder: null,
    selectedIndex: 0,
  });

  return newState;
};

export const updateBuildQuery = (state: State, query: string): State => {
  const hasNoBuilder = !state.builder;
  if (hasNoBuilder) return state;

  const builder = state.builder!;
  const methods = getMethodsForType(builder.baseType);
  const methodMatches = fuzzySearch(methods, query, (method: Method) => method.signature);

  const newState = Object.assign({}, state, {
    query,
    methodMatches,
    selectedIndex: 0,
  });

  return newState;
};

export const updateArrowFnQuery = (state: State, query: string): State => {
  const hasNoBuilder = !state.builder;
  const hasNoContext = !state.builder?.arrowFnContext;
  if (hasNoBuilder || hasNoContext) return state;

  const context = state.builder!.arrowFnContext!;
  const propertyMatches = fuzzySearch(context.paramPaths, query, (path) => path.path);

  const newState = Object.assign({}, state, {
    query,
    propertyMatches,
    selectedIndex: 0,
  });

  return newState;
};

export const selectMethod = (state: State, methodIndex: number): State => {
  const hasNoBuilder = !state.builder;
  if (hasNoBuilder) return state;

  const builder = state.builder!;
  const hasInvalidIndex = methodIndex < 0 || methodIndex >= state.methodMatches.length;
  if (hasInvalidIndex) return state;

  const method = state.methodMatches[methodIndex].item;
  const template = method.template || "";

  const needsArrowFn =
    template.includes("x =>") ||
    template.includes("(a, b)") ||
    template.includes("(acc, x)");

  if (needsArrowFn) {
    const isArrayMethod = builder.baseType === "Array";

    const getArraySampleValue = (): unknown => {
      if (!Array.isArray(builder.baseValue)) return {};
      if (builder.baseValue.length === 0) return {};
      return builder.baseValue[0];
    };

    const paramValue = isArrayMethod
      ? getArraySampleValue()
      : builder.baseValue;

    const paramType = Array.isArray(paramValue)
      ? "Array"
      : paramValue === null
        ? "null"
        : typeof paramValue === "object"
          ? "Object"
          : typeof paramValue === "string"
            ? "String"
            : typeof paramValue === "number"
              ? "Number"
              : typeof paramValue === "boolean"
                ? "Boolean"
                : "unknown";

    const paramName = template.includes("(a, b)") ? "a" : "x";
    const paramPaths = navigateJson(paramValue);

    const arrowFnContext: ArrowFnContext = {
      paramName,
      paramType,
      paramValue,
      paramPaths,
      expression: "",
    };

    const propertyMatches = fuzzySearch(paramPaths, "", (path) => path.path);

    const newBuilder = Object.assign({}, builder, {
      currentMethodIndex: methodIndex,
      arrowFnContext,
      expression: builder.expression + template,
    });

    const newState = Object.assign({}, state, {
      mode: "build-arrow-fn" as const,
      builder: newBuilder,
      query: "",
      selectedIndex: 0,
      propertyMatches,
    });

    return newState;
  }

  const newExpression = builder.expression + template;

  const newBuilder = Object.assign({}, builder, {
    expression: newExpression,
    currentMethodIndex: methodIndex,
  });

  const newState = Object.assign({}, state, {
    builder: newBuilder,
  });

  return newState;
};

export const updateArrowFnExpression = (
  state: State,
  pathIndex: number,
): State => {
  const hasNoBuilder = !state.builder;
  const hasNoContext = !state.builder?.arrowFnContext;

  if (hasNoBuilder || hasNoContext) return state;

  const hasInvalidIndex = pathIndex < 0 || pathIndex >= state.propertyMatches.length;
  if (hasInvalidIndex) return state;

  const builder = state.builder!;
  const context = builder.arrowFnContext!;
  const selectedPath = state.propertyMatches[pathIndex].item;
  const paramName = context.paramName;

  const arrowExpression = selectedPath.path === "."
    ? paramName
    : `${paramName}${selectedPath.path}`;

  const newContext = Object.assign({}, context, {
    expression: arrowExpression,
  });

  const newBuilder = Object.assign({}, builder, {
    arrowFnContext: newContext,
  });

  const newState = Object.assign({}, state, {
    builder: newBuilder,
  });

  return newState;
};

export const completeArrowFn = (state: State): State => {
  const hasNoBuilder = !state.builder;
  const hasNoContext = !state.builder?.arrowFnContext;

  if (hasNoBuilder || hasNoContext) return state;

  const builder = state.builder!;
  const context = builder.arrowFnContext!;
  const hasNoExpression = !context.expression;

  if (hasNoExpression) return state;

  const methods = getMethodsForType(builder.baseType);
  const method = methods[builder.currentMethodIndex];
  const template = method.template || "";

  const replaceLastOccurrence = (str: string, find: string, replace: string): string => {
    const lastIndex = str.lastIndexOf(find);
    if (lastIndex === -1) return str;

    return str.substring(0, lastIndex) + replace + str.substring(lastIndex + find.length);
  };

  let finalExpression = builder.expression;

  if (template.includes("x => x")) {
    finalExpression = replaceLastOccurrence(finalExpression, "x => x", `x => ${context.expression}`);
  } else if (template.includes("(a, b) => a - b")) {
    finalExpression = replaceLastOccurrence(finalExpression, "(a, b) => a - b", `(a, b) => ${context.expression}`);
  } else if (template.includes("(acc, x) => acc")) {
    finalExpression = replaceLastOccurrence(finalExpression, "(acc, x) => acc", `(acc, x) => ${context.expression}`);
  }

  const newBuilder = Object.assign({}, builder, {
    expression: finalExpression,
    arrowFnContext: null,
  });

  const newState = Object.assign({}, state, {
    mode: "build" as const,
    builder: newBuilder,
    query: "",
    selectedIndex: 0,
  });

  return newState;
};

export const cancelArrowFn = (state: State): State => {
  const hasNoBuilder = !state.builder;
  if (hasNoBuilder) return state;

  const builder = state.builder!;
  const methods = getMethodsForType(builder.baseType);
  const method = methods[builder.currentMethodIndex];
  const template = method.template || "";

  const expressionWithoutTemplate = builder.expression.replace(template, "");

  const newBuilder = Object.assign({}, builder, {
    expression: expressionWithoutTemplate,
    arrowFnContext: null,
  });

  const newState = Object.assign({}, state, {
    mode: "build" as const,
    builder: newBuilder,
  });

  return newState;
};

export const undoLastSegment = (state: State): State => {
  const hasNoBuilder = !state.builder;
  if (hasNoBuilder) return state;

  const builder = state.builder!;
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

  const newState = Object.assign({}, state, {
    builder: newBuilder,
    methodMatches,
    query: "",
    selectedIndex: 0,
  });

  return newState;
};
