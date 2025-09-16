import { ASTNode, ArrowFunctionNode } from "../types";

export class JsonNavigator {
  evaluate(ast: ASTNode, data: any): any {
    switch (ast.type) {
      case "Root":
        return ast.expression ? this.evaluate(ast.expression, data) : data;

      case "PropertyAccess":
        const baseValue = ast.object ? this.evaluate(ast.object, data) : data;
        if (!baseValue) return undefined;
        return baseValue[ast.property];

      case "IndexAccess":
        const arrayValue = ast.object ? this.evaluate(ast.object, data) : data;
        if (!Array.isArray(arrayValue)) return undefined;

        const index = ast.index < 0 ? arrayValue.length + ast.index : ast.index;
        return arrayValue[index];

      case "SliceAccess":
        const sliceArray = ast.object ? this.evaluate(ast.object, data) : data;
        if (!Array.isArray(sliceArray)) return undefined;

        const arrayLen = sliceArray.length;
        const start =
          ast.start !== undefined
            ? ast.start < 0
              ? arrayLen + ast.start
              : ast.start
            : 0;
        const end =
          ast.end !== undefined
            ? ast.end < 0
              ? arrayLen + ast.end
              : ast.end
            : arrayLen;
        return sliceArray.slice(start, end);

      case "ArraySpread":
        const spreadValue = ast.object ? this.evaluate(ast.object, data) : data;
        if (!Array.isArray(spreadValue)) return undefined;
        return spreadValue;

      case "MethodCall":
        const targetValue = ast.object ? this.evaluate(ast.object, data) : data;
        return this.executeMethod(targetValue, ast.method, ast.args, data);

      case "ObjectOperation":
        const objValue = ast.object ? this.evaluate(ast.object, data) : data;
        const isValidObject = objValue && typeof objValue === "object";
        if (!isValidObject) return undefined;

        switch (ast.operation) {
          case "keys":
            return Object.keys(objValue);
          case "values":
            return Object.values(objValue);
          case "entries":
            return Object.entries(objValue);
          case "length":
            const isArray = Array.isArray(objValue);
            return isArray ? objValue.length : Object.keys(objValue).length;
          default:
            return undefined;
        }

      case "Literal":
        return ast.value;

      case "ArrowFunction":
        return this.createFunction(ast);

      default:
        throw new Error(`Unknown AST node type: ${(ast as any).type}`);
    }
  }

  private executeMethod(
    target: any,
    method: string,
    args: ASTNode[],
    context: any,
  ): any {
    if (!target) return undefined;

    const evaluatedArgs = args.map((arg) => {
      const isArrowFunction = arg.type === "ArrowFunction";
      return isArrowFunction
        ? this.createFunction(arg)
        : this.evaluate(arg, context);
    });

    // Handle synthetic operator methods
    const isOperatorMethod =
      method.startsWith("__operator_") && method.endsWith("__");
    if (isOperatorMethod) {
      const operator = method.slice(11, -2);
      return this.executeOperator(target, operator, evaluatedArgs[0]);
    }

    // Check if method exists on target
    const isFunction = typeof target[method] === "function";
    if (!isFunction) {
      throw new Error(`Method ${method} does not exist on ${typeof target}`);
    }

    try {
      // Execute the method
      const result = target[method](...evaluatedArgs);
      return result;
    } catch (error: any) {
      throw new Error(`Error executing method ${method}: ${error.message}`);
    }
  }

  private executeOperator(left: any, operator: string, right: any): any {
    switch (operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case ">":
        return left > right;
      case "<":
        return left < right;
      case ">=":
        return left >= right;
      case "<=":
        return left <= right;
      case "==":
        return left == right;
      case "===":
        return left === right;
      case "!=":
        return left != right;
      case "!==":
        return left !== right;
      case "&&":
        return left && right;
      case "||":
        return left || right;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private createFunction(node: ArrowFunctionNode): Function {
    return (...args: any[]) => {
      // Create a context object with parameter bindings
      const context: any = {};
      node.params.forEach((param, index) => {
        context[param] = args[index];
      });

      // Evaluate the function body with the parameter context
      return this.evaluateFunctionBody(node.body, context);
    };
  }

  private evaluateFunctionBody(ast: ASTNode, context: any): any {
    switch (ast.type) {
      case "PropertyAccess":
        if (!ast.object) {
          // Check if it's a parameter reference
          const isParameter = context.hasOwnProperty(ast.property);
          if (isParameter) return context[ast.property];

          // Otherwise treat as property access on the implicit parameter
          const implicitParam = Object.values(context)[0];
          const isValidObject =
            implicitParam && typeof implicitParam === "object";
          return isValidObject
            ? (implicitParam as Record<string, unknown>)[ast.property]
            : undefined;
        }

        const baseObj = this.evaluateFunctionBody(ast.object, context);
        return baseObj ? baseObj[ast.property] : undefined;

      case "MethodCall":
        const targetObj = ast.object
          ? this.evaluateFunctionBody(ast.object, context)
          : Object.values(context)[0];

        const methodArgs = ast.args.map((arg) =>
          this.evaluateFunctionBody(arg, context),
        );

        // Handle synthetic operator methods
        const isOperatorMethod =
          ast.method.startsWith("__operator_") && ast.method.endsWith("__");
        if (isOperatorMethod) {
          const operator = ast.method.slice(11, -2);
          return this.executeOperator(targetObj, operator, methodArgs[0]);
        }

        if (!targetObj) return undefined;

        const targetMethod = targetObj[ast.method];
        const isFunction = typeof targetMethod === "function";
        return isFunction ? targetMethod(...methodArgs) : undefined;

      case "Literal":
        return ast.value;

      case "Root":
        return ast.expression
          ? this.evaluateFunctionBody(ast.expression, context)
          : context;

      default:
        // For other node types, fall back to regular evaluation
        return this.evaluate(ast, Object.values(context)[0]);
    }
  }
}
