import { ASTNode, ArrowFunctionNode, MethodCallNode } from "../types";

type EvaluationContext = Record<string, unknown>;
type OperatorFunction = (left: unknown, right: unknown) => unknown;

export const OPERATORS: Readonly<Record<string, OperatorFunction>> = {
  "+": (left: unknown, right: unknown) => (left as number) + (right as number),
  "-": (left: unknown, right: unknown) => (left as number) - (right as number),
  "*": (left: unknown, right: unknown) => (left as number) * (right as number),
  "/": (left: unknown, right: unknown) => (left as number) / (right as number),
  "%": (left: unknown, right: unknown) => (left as number) % (right as number),
  ">": (left: unknown, right: unknown) => (left as any) > (right as any),
  "<": (left: unknown, right: unknown) => (left as any) < (right as any),
  ">=": (left: unknown, right: unknown) => (left as any) >= (right as any),
  "<=": (left: unknown, right: unknown) => (left as any) <= (right as any),
  "==": (left: unknown, right: unknown) => left == right,
  "===": (left: unknown, right: unknown) => left === right,
  "!=": (left: unknown, right: unknown) => left != right,
  "!==": (left: unknown, right: unknown) => left !== right,
  "&&": (left: unknown, right: unknown) => (left as any) && (right as any),
  "||": (left: unknown, right: unknown) => (left as any) || (right as any),
};

export function isOperatorMethod(method: string): boolean {
  return method.startsWith("__operator_") && method.endsWith("__");
}

export function extractOperator(method: string): string {
  return method.slice(11, -2);
}

export function executeOperator(
  left: unknown,
  operator: string,
  right: unknown,
): unknown {
  const operatorFn = OPERATORS[operator];
  if (!operatorFn) {
    throw new Error(`Unknown operator: ${operator}`);
  }
  return operatorFn(left, right);
}

export function createParameterContext(
  params: readonly string[],
  args: readonly unknown[],
): EvaluationContext {
  return Object.fromEntries(params.map((param, index) => [param, args[index]]));
}

export function getImplicitParameter(context: EvaluationContext): unknown {
  const values = Object.values(context);
  return values[0];
}

export function isValidObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function getPropertyFromObject(
  obj: unknown,
  property: string,
): unknown {
  if (!isValidObject(obj)) return undefined;
  return obj[property];
}

export function normalizeArrayIndex(index: number, length: number): number {
  return index < 0 ? length + index : index;
}

export function getArrayElement(arr: unknown, index: number): unknown {
  if (!Array.isArray(arr)) return undefined;

  const normalizedIndex = normalizeArrayIndex(index, arr.length);
  return arr[normalizedIndex];
}

export function sliceArray(
  arr: unknown,
  start: number | undefined,
  end: number | undefined,
): unknown {
  if (!Array.isArray(arr)) return undefined;

  const arrayLen = arr.length;
  const normalizedStart =
    start !== undefined ? normalizeArrayIndex(start, arrayLen) : 0;
  const normalizedEnd =
    end !== undefined ? normalizeArrayIndex(end, arrayLen) : arrayLen;

  return arr.slice(normalizedStart, normalizedEnd);
}

export function evaluateObjectOperation(
  obj: unknown,
  operation: "keys" | "values" | "entries" | "length",
): unknown {
  if (!isValidObject(obj)) return undefined;

  switch (operation) {
    case "keys":
      return Object.keys(obj);
    case "values":
      return Object.values(obj);
    case "entries":
      return Object.entries(obj);
    case "length":
      return Array.isArray(obj) ? obj.length : Object.keys(obj).length;
  }
}

export function isCallableMethod(target: unknown, method: string): boolean {
  if (!isValidObject(target)) return false;
  const methodValue = (target as Record<string, unknown>)[method];
  return typeof methodValue === "function";
}

export function callMethod(
  target: unknown,
  method: string,
  args: readonly unknown[],
): unknown {
  const hasMethod = target !== null && target !== undefined && typeof (target as any)[method] === "function";
  if (!hasMethod) {
    throw new Error(`Method ${method} does not exist on ${typeof target}`);
  }

  try {
    const methodFn = (target as any)[method];
    return methodFn.call(target, ...args);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error executing method ${method}: ${errorMessage}`);
  }
}

export class JsonNavigator {
  evaluate(ast: ASTNode, data: unknown): unknown {
    switch (ast.type) {
      case "Root":
        return ast.expression ? this.evaluate(ast.expression, data) : data;

      case "PropertyAccess":
        return this.evaluatePropertyAccess(ast, data);

      case "IndexAccess":
        return getArrayElement(ast.object ? this.evaluate(ast.object, data) : data, ast.index);

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

      default:
        throw new Error(`Unknown AST node type: ${(ast as ASTNode).type}`);
    }
  }

  private evaluatePropertyAccess(
    ast: { property: string; object?: ASTNode },
    data: unknown,
  ): unknown {
    const baseValue = ast.object ? this.evaluate(ast.object, data) : data;
    return getPropertyFromObject(baseValue, ast.property);
  }

  private evaluateMethodCall(ast: MethodCallNode, data: unknown): unknown {
    const target = ast.object ? this.evaluate(ast.object, data) : data;

    const isOperator = isOperatorMethod(ast.method);
    if (isOperator) {
      const operator = extractOperator(ast.method);
      const evaluatedArg = this.evaluate(ast.args[0], data);
      return executeOperator(target, operator, evaluatedArg);
    }

    const evaluatedArgs = ast.args.map((arg) => {
      const isArrowFunction = arg.type === "ArrowFunction";
      return isArrowFunction ? this.createFunction(arg) : this.evaluate(arg, data);
    });

    return callMethod(target, ast.method, evaluatedArgs);
  }

  private createFunction(node: ArrowFunctionNode): Function {
    return (...args: unknown[]) => {
      const context = createParameterContext(node.params, args);
      return this.evaluateFunctionBody(node.body, context);
    };
  }

  private evaluateFunctionBody(ast: ASTNode, context: EvaluationContext): unknown {
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

    const isParameter = Object.prototype.hasOwnProperty.call(context, ast.property);
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
