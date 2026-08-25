import { updateSelection, updateQuery, getSelectedPath, acceptTooltipHint, dismissTooltip } from "./state";
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

const KEYS = Object.assign({}, {
  CTRL_C: "\x03",
  ESCAPE: "\x1b",
  ENTER: "\r",
  TAB: "\t",
  UP: "\x1b[A",
  DOWN: "\x1b[B",
  LEFT: "\x1b[D",
  RIGHT: "\x1b[C",
  BACKSPACE: "\x7f",
} as const);

const isEscapeKey = (key: string): boolean => key === KEYS.ESCAPE;

const isCtrlCKey = (key: string): boolean => key === KEYS.CTRL_C;

const isExitKey = (key: string, state: State): boolean => {
  const isEscape = key === KEYS.ESCAPE;
  const isQ = key === "q" && state.query.length === 0;
  return isEscape || isQ;
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
  const isTooltipActive = state.tooltip.visible;

  const isAcceptKey = isTabKey(key) || isRightKey(key);
  const shouldAcceptTooltip = isTooltipActive && isAcceptKey;
  if (shouldAcceptTooltip) {
    const newState = acceptTooltipHint(state);
    return { state: newState, output: null };
  }

  const shouldMoveTooltipUp = isTooltipActive && isUpKey(key);
  if (shouldMoveTooltipUp) {
    const newState = updateSelection(state, -1);
    return { state: newState, output: null };
  }

  const shouldMoveTooltipDown = isTooltipActive && isDownKey(key);
  if (shouldMoveTooltipDown) {
    const newState = updateSelection(state, 1);
    return { state: newState, output: null };
  }

  if (isTabKey(key)) {
    const newState = enterBuildMode(state);
    return { state: newState, output: null };
  }

  if (isEnterKey(key)) {
    const selected = getSelectedPath(state);
    if (selected) {
      return { state: null, output: selected.path };
    }
    const hasQuery = state.query.length > 0;
    if (hasQuery) return { state: null, output: state.query };
    return { state: null, output: null };
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
  if (isEnterKey(key)) {
    const hasNoBuilder = !state.builder;
    if (hasNoBuilder) return { state, output: null };

    const output = state.builder!.expression;
    return { state: null, output };
  }

  const isAcceptKey = isRightKey(key) || isTabKey(key);
  if (isAcceptKey) {
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
  if (isEnterKey(key)) {
    const hasNoBuilder = !state.builder;
    if (hasNoBuilder) return { state, output: null };

    const output = state.builder!.expression;
    return { state: null, output };
  }

  const isAcceptKey = isRightKey(key) || isTabKey(key);
  if (isAcceptKey) {
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

const MODE_HANDLERS: Record<State["mode"], (state: State, key: string) => InputResult> = {
  explore: handleExploreMode,
  build: handleBuildMode,
  "build-arrow-fn": handleArrowFnMode,
};

export const handleInput = (state: State, data: Buffer): InputResult => {
  const key = data.toString();

  if (isCtrlCKey(key)) {
    return { state: null, output: null };
  }

  const isTooltipDismiss = isEscapeKey(key) && state.mode === "explore" && state.tooltip.visible;
  if (isTooltipDismiss) {
    const newState = dismissTooltip(state);
    return { state: newState, output: null };
  }

  if (isExitKey(key, state)) {
    if (state.mode === "build-arrow-fn") {
      const newState = cancelArrowFn(state);
      return { state: newState, output: null };
    }

    if (state.mode === "build") {
      const newState = exitBuildMode(state);
      return { state: newState, output: null };
    }

    return { state: null, output: null };
  }

  const handler = MODE_HANDLERS[state.mode];
  return handler(state, key);
};
