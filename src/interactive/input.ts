import { updateSelection, updateQuery, getSelectedPath } from "./state";
import {
  enterBuildMode,
  exitBuildMode,
  selectMethod,
  updateArrowFnExpression,
  completeArrowFn,
  cancelArrowFn,
  updateBuildQuery,
  updateArrowFnQuery,
  undoLastSegment,
} from "./builder";
import type { State } from "./types";

const KEYS = Object.assign(
  {},
  {
    CTRL_C: "\x03",
    ESCAPE: "\x1b",
    ENTER: "\r",
    TAB: "\t",
    UP: "\x1b[A",
    DOWN: "\x1b[B",
    LEFT: "\x1b[D",
    RIGHT: "\x1b[C",
    BACKSPACE: "\x7f",
  } as const,
);

const isExitKey = (key: string): boolean => {
  const isCtrlC = key === KEYS.CTRL_C;
  const isEscape = key === KEYS.ESCAPE;
  const isQ = key === "q";
  return isCtrlC || isEscape || isQ;
};

const isEnterKey = (key: string): boolean => key === KEYS.ENTER;

const isTabKey = (key: string): boolean => key === KEYS.TAB;

const isUpKey = (key: string): boolean => key === KEYS.UP;

const isDownKey = (key: string): boolean => key === KEYS.DOWN;

const isLeftKey = (key: string): boolean => key === KEYS.LEFT;

const isRightKey = (key: string): boolean => key === KEYS.RIGHT;

const isBackspaceKey = (key: string): boolean => key === KEYS.BACKSPACE;

const isPrintableKey = (key: string): boolean => {
  const isGreaterThanSpace = key >= " ";
  const isLessThanTilde = key <= "~";
  return isGreaterThanSpace && isLessThanTilde;
};

type InputResult = { state: State | null; output: string | null };

const handleExploreMode = (state: State, key: string): InputResult => {
  if (isTabKey(key)) {
    const newState = enterBuildMode(state);
    return { state: newState, output: null };
  }

  if (isEnterKey(key)) {
    const selected = getSelectedPath(state);
    if (!selected) return { state: null, output: null };

    const output = JSON.stringify(selected.value, null, 2);
    return { state: null, output };
  }

  if (isUpKey(key)) {
    const newState = updateSelection(state, -1);
    return { state: newState, output: null };
  }

  if (isDownKey(key)) {
    const newState = updateSelection(state, 1);
    return { state: newState, output: null };
  }

  if (isBackspaceKey(key)) {
    const newQuery = state.query.slice(0, -1);
    const newState = updateQuery(state, newQuery);
    return { state: newState, output: null };
  }

  if (isPrintableKey(key)) {
    const newQuery = state.query.concat(key);
    const newState = updateQuery(state, newQuery);
    return { state: newState, output: null };
  }

  return { state, output: null };
};

const handleBuildMode = (state: State, key: string): InputResult => {
  if (key === KEYS.ESCAPE) {
    const newState = exitBuildMode(state);
    return { state: newState, output: null };
  }

  if (isEnterKey(key)) {
    const hasNoBuilder = !state.builder;
    if (hasNoBuilder) return { state, output: null };

    const output = state.builder!.expression;
    return { state: null, output };
  }

  if (isRightKey(key) || isTabKey(key)) {
    const hasNoBuilder = !state.builder;
    if (hasNoBuilder) return { state, output: null };

    const newState = selectMethod(state, state.selectedIndex);
    return { state: newState, output: null };
  }

  if (isLeftKey(key)) {
    const newState = undoLastSegment(state);
    return { state: newState, output: null };
  }

  if (isUpKey(key)) {
    const newState = updateSelection(state, -1);
    return { state: newState, output: null };
  }

  if (isDownKey(key)) {
    const newState = updateSelection(state, 1);
    return { state: newState, output: null };
  }

  if (isBackspaceKey(key)) {
    const newQuery = state.query.slice(0, -1);
    const newState = updateBuildQuery(state, newQuery);
    return { state: newState, output: null };
  }

  if (isPrintableKey(key)) {
    const newQuery = state.query.concat(key);
    const newState = updateBuildQuery(state, newQuery);
    return { state: newState, output: null };
  }

  return { state, output: null };
};

const handleArrowFnMode = (state: State, key: string): InputResult => {
  if (key === KEYS.ESCAPE) {
    const newState = cancelArrowFn(state);
    return { state: newState, output: null };
  }

  if (isEnterKey(key)) {
    const hasNoBuilder = !state.builder;
    if (hasNoBuilder) return { state, output: null };

    const output = state.builder!.expression;
    return { state: null, output };
  }

  if (isRightKey(key) || isTabKey(key)) {
    const withPath = updateArrowFnExpression(state, state.selectedIndex);
    const completed = completeArrowFn(withPath);
    return { state: completed, output: null };
  }

  if (isLeftKey(key)) {
    const newState = cancelArrowFn(state);
    return { state: newState, output: null };
  }

  if (isUpKey(key)) {
    const newState = updateSelection(state, -1);
    return { state: newState, output: null };
  }

  if (isDownKey(key)) {
    const newState = updateSelection(state, 1);
    return { state: newState, output: null };
  }

  if (isBackspaceKey(key)) {
    const newQuery = state.query.slice(0, -1);
    const newState = updateArrowFnQuery(state, newQuery);
    return { state: newState, output: null };
  }

  if (isPrintableKey(key)) {
    const newQuery = state.query.concat(key);
    const newState = updateArrowFnQuery(state, newQuery);
    return { state: newState, output: null };
  }

  return { state, output: null };
};

const MODE_HANDLERS: Record<
  State["mode"],
  (state: State, key: string) => InputResult
> = {
  explore: handleExploreMode,
  build: handleBuildMode,
  "build-arrow-fn": handleArrowFnMode,
};

export const handleInput = (state: State, data: Buffer): InputResult => {
  const key = data.toString();

  if (isExitKey(key)) {
    const isInBuildMode =
      state.mode === "build" || state.mode === "build-arrow-fn";

    if (isInBuildMode) {
      const newState = exitBuildMode(state);
      return { state: newState, output: null };
    }

    return { state: null, output: null };
  }

  const handler = MODE_HANDLERS[state.mode];
  return handler(state, key);
};
