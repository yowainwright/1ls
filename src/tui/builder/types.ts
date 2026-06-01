import type { State } from "../types";

export type StateTransition = (state: State) => State;
export type StateTransitionWithQuery = (state: State, query: string) => State;
export type StateTransitionWithIndex = (state: State, index: number) => State;
