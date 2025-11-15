export interface JsonPath {
  path: string;
  value: unknown;
  type: string;
  displayValue: string;
}

export type InteractiveMode = "explore" | "build" | "build-arrow-fn";

export interface ExpressionBuilder {
  basePath: string;
  baseValue: unknown;
  baseType: string;
  expression: string;
  currentMethodIndex: number;
  arrowFnContext: ArrowFnContext | null;
}

export interface ArrowFnContext {
  paramName: string;
  paramType: string;
  paramValue: unknown;
  paramPaths: JsonPath[];
  expression: string;
}

export interface Method {
  name: string;
  signature: string;
  description: string;
  template?: string;
  category?: string;
}

export interface State {
  mode: InteractiveMode;
  paths: JsonPath[];
  matches: FuzzyMatch<JsonPath>[];
  query: string;
  selectedIndex: number;
  builder: ExpressionBuilder | null;
  originalData: unknown;
  methodMatches: FuzzyMatch<Method>[];
  propertyMatches: FuzzyMatch<JsonPath>[];
}

export interface FuzzyMatch<T> {
  item: T;
  score: number;
  matches: number[];
}
