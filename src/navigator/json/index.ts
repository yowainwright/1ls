import type {
  ASTNode,
  ArrowFunctionNode,
  MethodCallNode,
  RecursiveDescentNode,
  OptionalAccessNode,
  NullCoalescingNode,
} from "../../types";
import type { EvaluationContext } from "../types";
import type { NavigatorOptions } from "./types";
import { BUILTIN_FUNCTIONS } from "../builtins/constants";
import { isBuiltin, executeBuiltin } from "../builtins";
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
} from "./utils";

export { OPERATORS } from "./constants";
export type { NavigatorOptions } from "./types";
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
} from "./utils";

export class JsonNavigator {
  private options: NavigatorOptions;

  constructor(options: NavigatorOptions = {}) {
    this.options = options;
  }

  evaluate(ast: ASTNode, data: unknown): unknown {
    switch (ast.type) {
      case "Root":
        return ast.expression ? this.evaluate(ast.expression, data) : data;

      case "PropertyAccess":
        return this.evaluatePropertyAccess(ast, data);

      case "IndexAccess":
        return getArrayElement(
          ast.object ? this.evaluate(ast.object, data) : data,
          ast.index,
        );

      case "SliceAccess":
        return sliceArray(
          ast.object ? this.evaluate(ast.object, data) : data,
          ast.start,
          ast.end,
        );

      case "ArraySpread":
        return ast.object ? this.evaluate(ast.object, data) : data;

      case "MethodCall":
        return this.evaluateMethodCall(ast, data);

      case "ObjectOperation":
        return evaluateObjectOperation(
          ast.object ? this.evaluate(ast.object, data) : data,
          ast.operation,
        );

      case "Literal":
        return ast.value;

      case "ArrowFunction":
        return this.createFunction(ast);

      case "RecursiveDescent":
        return this.evaluateRecursiveDescent(ast, data);

      case "OptionalAccess":
        return this.evaluateOptionalAccess(ast, data);

      case "NullCoalescing":
        return this.evaluateNullCoalescing(ast, data);

      default:
        throw new Error(`Unknown AST node type: ${(ast as ASTNode).type}`);
    }
  }

  private evaluatePropertyAccess(
    ast: { property: string; object?: ASTNode },
    data: unknown,
  ): unknown {
    const baseValue = ast.object ? this.evaluate(ast.object, data) : data;
    const result = getPropertyFromObject(baseValue, ast.property);

    if (this.options.strict && result === undefined) {
      const path = ast.property;
      throw new Error(`Property "${path}" is undefined`);
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
      return this.evaluatePipe([...ast.args].reverse(), data);
    }

    const target = ast.object ? this.evaluate(ast.object, data) : data;

    if (isBuiltin(ast.method)) {
      const evaluatedArgs = ast.args.map((arg) => this.evaluateArg(arg, data));
      return executeBuiltin(ast.method, target, evaluatedArgs);
    }

    const isOperator = isOperatorMethod(ast.method);
    if (isOperator) {
      const operator = extractOperator(ast.method);
      const evaluatedArg = this.evaluate(ast.args[0], data);
      return executeOperator(target, operator, evaluatedArg);
    }

    const evaluatedArgs = ast.args.map((arg) => this.evaluateArg(arg, data));
    return callMethod(target, ast.method, evaluatedArgs);
  }

  private evaluatePipe(args: ASTNode[], data: unknown): unknown {
    return args.reduce((result, arg) => this.evaluate(arg, result), data);
  }

  private evaluateRecursiveDescent(
    ast: RecursiveDescentNode,
    data: unknown,
  ): unknown[] {
    const baseData = ast.object ? this.evaluate(ast.object, data) : data;
    return this.collectAllValues(baseData);
  }

  private collectAllValues(data: unknown): unknown[] {
    const isArrayData = Array.isArray(data);
    const isObjectData =
      data !== null && typeof data === "object" && !isArrayData;
    const self = [data];

    if (isArrayData) {
      const children = data.flatMap((item) => this.collectAllValues(item));
      return [...self, ...children];
    }

    if (isObjectData) {
      const children = Object.values(data as Record<string, unknown>).flatMap(
        (val) => this.collectAllValues(val),
      );
      return [...self, ...children];
    }

    return self;
  }

  private evaluateOptionalAccess(
    ast: OptionalAccessNode,
    data: unknown,
  ): unknown {
    try {
      return this.evaluate(ast.expression, data);
    } catch {
      return null;
    }
  }

  private evaluateNullCoalescing(
    ast: NullCoalescingNode,
    data: unknown,
  ): unknown {
    const leftValue = this.evaluate(ast.left, data);
    const isNullish = leftValue === null || leftValue === undefined;
    return isNullish ? this.evaluate(ast.right, data) : leftValue;
  }

  private createFunction(
    node: ArrowFunctionNode,
  ): (...args: unknown[]) => unknown {
    return (...args: unknown[]) => {
      const context = createParameterContext(node.params, args);
      return this.evaluateFunctionBody(node.body, context);
    };
  }

  private evaluateFunctionBody(
    ast: ASTNode,
    context: EvaluationContext,
  ): unknown {
    switch (ast.type) {
      case "PropertyAccess":
        return this.evaluatePropertyAccessInFunction(ast, context);

      case "MethodCall":
        return this.evaluateMethodCallInFunction(ast, context);

      case "Literal":
        return ast.value;

      case "Root":
        return ast.expression
          ? this.evaluateFunctionBody(ast.expression, context)
          : context;

      default:
        return this.evaluate(ast, getImplicitParameter(context));
    }
  }

  private evaluatePropertyAccessInFunction(
    ast: { property: string; object?: ASTNode },
    context: EvaluationContext,
  ): unknown {
    const hasObject = ast.object !== undefined;
    if (hasObject) {
      const baseObj = this.evaluateFunctionBody(ast.object!, context);
      return getPropertyFromObject(baseObj, ast.property);
    }

    const isParameter = Object.prototype.hasOwnProperty.call(
      context,
      ast.property,
    );
    if (isParameter) {
      return context[ast.property];
    }

    const implicitParam = getImplicitParameter(context);
    return getPropertyFromObject(implicitParam, ast.property);
  }

  private evaluateMethodCallInFunction(
    ast: MethodCallNode,
    context: EvaluationContext,
  ): unknown {
    const target = ast.object
      ? this.evaluateFunctionBody(ast.object, context)
      : getImplicitParameter(context);

    const isOperator = isOperatorMethod(ast.method);
    if (isOperator) {
      const operator = extractOperator(ast.method);
      const evaluatedArg = this.evaluateFunctionBody(ast.args[0], context);
      return executeOperator(target, operator, evaluatedArg);
    }

    const methodArgs = ast.args.map((arg) =>
      this.evaluateFunctionBody(arg, context),
    );

    return callMethod(target, ast.method, methodArgs);
  }
}
