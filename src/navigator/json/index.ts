import type {
  ASTNode,
  ArrowFunctionNode,
  MethodCallNode,
  RecursiveDescentNode,
  OptionalAccessNode,
  NullCoalescingNode,
} from "../../types.ts";
import type { EvaluationContext, EvaluatedFunction } from "../types.ts";
import type { NavigatorOptions } from "./types.ts";
import { BUILTIN_FUNCTIONS } from "../builtins/constants.ts";
import { isBuiltin, executeBuiltin } from "../builtins/index.ts";
import {
  isOperatorMethod,
  extractOperator,
  executeOperator,
  createParameterContext,
  getImplicitParameter,
  getPropertyFromObject,
  getArrayElement,
  sliceArray,
  evaluateObjectOperation,
  callMethod,
} from "./utils.ts";

type AccessNode = Extract<ASTNode, { type: "IndexAccess" | "SliceAccess" | "ArraySpread" }>;

const isAccessNode = (ast: ASTNode): ast is AccessNode => {
  if (ast.type === "IndexAccess") return true;
  if (ast.type === "SliceAccess") return true;
  return ast.type === "ArraySpread";
};

const appendValue = (values: unknown[], value: unknown): void => {
  values[values.length] = value;
};

const appendValues = (target: unknown[], values: unknown[]): void => {
  for (const value of values) {
    appendValue(target, value);
  }
};

const getNodeObject = (ast: { object: ASTNode | null }): ASTNode | null => {
  return ast.object;
};

const getRootExpression = (ast: { expression: ASTNode | null }): ASTNode | null => {
  return ast.expression;
};

export { OPERATORS } from "./constants.ts";
export type { NavigatorOptions } from "./types.ts";
export {
  isOperatorMethod,
  extractOperator,
  executeOperator,
  createParameterContext,
  getImplicitParameter,
  isValidObject,
  getPropertyFromObject,
  normalizeArrayIndex,
  getArrayElement,
  sliceArray,
  evaluateObjectOperation,
  isCallableMethod,
  callMethod,
} from "./utils.ts";

export class JsonNavigator {
  private options: NavigatorOptions;

  constructor(options: NavigatorOptions = {}) {
    this.options = { strict: Boolean(options.strict) };
  }

  evaluate(ast: ASTNode, data: unknown): unknown {
    if (ast.type === "Root") {
      const expression = getRootExpression(ast);
      return expression ? this.evaluate(expression, data) : data;
    }
    if (ast.type === "PropertyAccess") return this.evaluatePropertyAccess(ast, data);
    if (isAccessNode(ast)) return this.evaluateAccess(ast, data);
    if (ast.type === "MethodCall") return this.evaluateMethodCall(ast, data);
    if (ast.type === "ObjectOperation") {
      const object = getNodeObject(ast);
      const target = object ? this.evaluate(object, data) : data;
      return evaluateObjectOperation(target, ast.operation);
    }
    return this.evaluateValue(ast, data);
  }

  private evaluateAccess(
    ast: AccessNode,
    data: unknown,
  ): unknown {
    if (ast.type === "IndexAccess") {
      const object = getNodeObject(ast);
      const target = object ? this.evaluate(object, data) : data;
      return getArrayElement(target, ast.index);
    }
    if (ast.type === "SliceAccess") {
      const object = getNodeObject(ast);
      const target = object ? this.evaluate(object, data) : data;
      return sliceArray(target, ast.start, ast.end);
    }
    const object = getNodeObject(ast);
    return object ? this.evaluate(object, data) : data;
  }

  private evaluateValue(ast: ASTNode, data: unknown): unknown {
    if (ast.type === "Literal") return ast.value;
    if (ast.type === "ArrowFunction") return this.createFunction(ast);
    if (ast.type === "RecursiveDescent") return this.evaluateRecursiveDescent(ast, data);
    if (ast.type === "OptionalAccess") return this.evaluateOptionalAccess(ast, data);
    if (ast.type === "NullCoalescing") return this.evaluateNullCoalescing(ast, data);
    throw new Error(`Unknown AST node type: ${ast.type}`);
  }

  private evaluatePropertyAccess(
    ast: { property: string; object: ASTNode | null },
    data: unknown,
  ): unknown {
    const object = getNodeObject(ast);
    const baseValue = object ? this.evaluate(object, data) : data;
    const result = getPropertyFromObject(baseValue, ast.property);

    const shouldRejectUndefined = this.options.strict && result === undefined;
    if (shouldRejectUndefined) {
      throw new Error(`Property "${ast.property}" is undefined`);
    }

    return result;
  }

  private evaluateArg(arg: ASTNode, data: unknown): unknown {
    const isArrowFunction = arg.type === "ArrowFunction";
    return isArrowFunction ? this.createFunction(arg) : this.evaluate(arg, data);
  }

  private evaluateMethodCall(ast: MethodCallNode, data: unknown): unknown {
    if (ast.method === BUILTIN_FUNCTIONS.PIPE) {
      return this.evaluatePipe(ast.args, data);
    }

    if (ast.method === BUILTIN_FUNCTIONS.COMPOSE) {
      return this.evaluatePipe(ast.args.slice().reverse(), data);
    }

    const object = getNodeObject(ast);
    const target = object ? this.evaluate(object, data) : data;

    if (isBuiltin(ast.method)) return this.evaluateBuiltinCall(ast, target, data);

    const isOperator = isOperatorMethod(ast.method);
    if (isOperator) return this.evaluateOperatorCall(ast, target, data);

    return this.evaluateRegularCall(ast, target, data);
  }

  private evaluateBuiltinCall(ast: MethodCallNode, target: unknown, data: unknown): unknown {
    const evaluatedArgs = this.evaluateArgs(ast.args, data);
    return executeBuiltin(ast.method, target, evaluatedArgs);
  }

  private evaluateOperatorCall(ast: MethodCallNode, target: unknown, data: unknown): unknown {
    const operator = extractOperator(ast.method);
    const evaluatedArg = this.evaluate(ast.args[0], data);
    return executeOperator(target, operator, evaluatedArg);
  }

  private evaluateRegularCall(ast: MethodCallNode, target: unknown, data: unknown): unknown {
    const evaluatedArgs = this.evaluateArgs(ast.args, data);
    return callMethod(target, ast.method, evaluatedArgs);
  }

  private evaluateArgs(args: ASTNode[], data: unknown): unknown[] {
    const values: unknown[] = [];

    for (const arg of args) {
      appendValue(values, this.evaluateArg(arg, data));
    }

    return values;
  }

  private evaluatePipe(args: ASTNode[], data: unknown): unknown {
    let result = data;

    for (const arg of args) {
      result = this.evaluate(arg, result);
    }

    return result;
  }

  private evaluateRecursiveDescent(ast: RecursiveDescentNode, data: unknown): unknown[] {
    const object = getNodeObject(ast);
    const baseData = object ? this.evaluate(object, data) : data;
    return this.collectAllValues(baseData);
  }

  private collectAllValues(data: unknown): unknown[] {
    if (Array.isArray(data)) {
      return this.collectArrayValues(data);
    }

    const isObject = data !== null && typeof data === "object";
    if (!isObject) return [data];

    return this.collectObjectValues(data as Record<string, unknown>);
  }

  private collectArrayValues(data: unknown[]): unknown[] {
    const values: unknown[] = [data];

    for (const item of data) {
      const childValues = this.collectAllValues(item);
      appendValues(values, childValues);
    }

    return values;
  }

  private collectObjectValues(data: Record<string, unknown>): unknown[] {
    const values: unknown[] = [data];

    for (const key of Object.keys(data)) {
      const childValues = this.collectAllValues(data[key]);
      appendValues(values, childValues);
    }

    return values;
  }

  private evaluateOptionalAccess(ast: OptionalAccessNode, data: unknown): unknown {
    try {
      return this.evaluate(ast.expression, data);
    } catch {
      return null;
    }
  }

  private evaluateNullCoalescing(ast: NullCoalescingNode, data: unknown): unknown {
    const leftValue = this.evaluate(ast.left, data);
    const isNullish = leftValue === null || leftValue === undefined;
    return isNullish ? this.evaluate(ast.right, data) : leftValue;
  }

  private createFunction(node: ArrowFunctionNode): EvaluatedFunction {
    return (value: unknown, index: unknown, array: unknown) => {
      const args = [value, index, array];
      const context = createParameterContext(node.params, args);
      return this.evaluateFunctionBody(node.body, context);
    };
  }

  private evaluateFunctionBody(ast: ASTNode, context: EvaluationContext): unknown {
    if (ast.type === "PropertyAccess") return this.evaluatePropertyAccessInFunction(ast, context);
    if (ast.type === "MethodCall") return this.evaluateMethodCallInFunction(ast, context);
    if (ast.type === "Literal") return ast.value;
    if (ast.type === "Root") {
      const expression = getRootExpression(ast);
      return expression ? this.evaluateFunctionBody(expression, context) : context;
    }
    return this.evaluate(ast, getImplicitParameter(context));
  }

  private evaluatePropertyAccessInFunction(
    ast: { property: string; object: ASTNode | null },
    context: EvaluationContext,
  ): unknown {
    const object = getNodeObject(ast);
    if (object) {
      const baseObj = this.evaluateFunctionBody(object, context);
      return getPropertyFromObject(baseObj, ast.property);
    }

    const isParameter = ast.property in context;
    if (isParameter) {
      return context[ast.property];
    }

    const implicitParam = getImplicitParameter(context);
    return getPropertyFromObject(implicitParam, ast.property);
  }

  private evaluateMethodCallInFunction(ast: MethodCallNode, context: EvaluationContext): unknown {
    const object = getNodeObject(ast);
    const target = object ? this.evaluateFunctionBody(object, context) : getImplicitParameter(context);

    const isOperator = isOperatorMethod(ast.method);
    if (isOperator) {
      const operator = extractOperator(ast.method);
      const evaluatedArg = this.evaluateFunctionBody(ast.args[0], context);
      return executeOperator(target, operator, evaluatedArg);
    }

    const methodArgs = this.evaluateFunctionArgs(ast.args, context);

    return callMethod(target, ast.method, methodArgs);
  }

  private evaluateFunctionArgs(args: ASTNode[], context: EvaluationContext): unknown[] {
    const values: unknown[] = [];

    for (const arg of args) {
      appendValue(values, this.evaluateFunctionBody(arg, context));
    }

    return values;
  }
}
