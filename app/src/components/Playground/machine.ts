import { setup, assign, fromPromise } from "xstate";
import type { PlaygroundContext, PlaygroundEvent, PlaygroundMode } from "./types";
import { States, MachineEvents, Actions, Guards, Actors, Delays, FORMAT_CONFIGS, SANDBOX_STARTER, DEFAULT_EXPRESSION } from "./constants";
import {
  loadInitialStateActor,
  persistPlaygroundState,
  computeFormatChange,
  isSandboxGuard,
  type InitialState,
} from "./utils";

export const playgroundMachine = setup({
  types: {
    context: {} as PlaygroundContext,
    events: {} as PlaygroundEvent,
    input: {} as { mode: PlaygroundMode },
  },
  actors: {
    [Actors.LOAD_INITIAL_STATE]: fromPromise<InitialState, { isSandbox: boolean }>(
      loadInitialStateActor,
    ),
  },
  actions: {
    [Actions.APPLY_INITIAL_STATE]: assign(({ event }) => {
      const loaded = (event as { output: InitialState }).output;
      return loaded ?? {};
    }),
    [Actions.PERSIST_STATE]: persistPlaygroundState,
    [Actions.UPDATE_FORMAT]: assign(({ context, event }) =>
      computeFormatChange(context, event.format),
    ),
  },
  guards: {
    [Guards.IS_SANDBOX]: isSandboxGuard,
  },
}).createMachine({
  id: "playground",
  context: ({ input }) => {
    const isSandbox = input.mode === "sandbox";
    return {
      isSandbox,
      format: "json" as const,
      input: isSandbox ? SANDBOX_STARTER.json.data : FORMAT_CONFIGS.json.placeholder,
      expression: isSandbox ? SANDBOX_STARTER.json.expression : DEFAULT_EXPRESSION,
      showMinifiedExpression: false,
    };
  },
  initial: States.INITIALIZING,
  on: {
    [MachineEvents.FORMAT_CHANGE]: {
      actions: [Actions.UPDATE_FORMAT, Actions.PERSIST_STATE],
    },
    [MachineEvents.INPUT_CHANGE]: {
      actions: [assign({ input: ({ event }) => event.input }), Actions.PERSIST_STATE],
    },
    [MachineEvents.EXPRESSION_CHANGE]: {
      actions: [assign({ expression: ({ event }) => event.expression }), Actions.PERSIST_STATE],
    },
    [MachineEvents.TOGGLE_MINIFIED]: {
      actions: assign({ showMinifiedExpression: ({ context }) => !context.showMinifiedExpression }),
    },
    [MachineEvents.FORMAT_DETECTED]: {
      guard: Guards.IS_SANDBOX,
      actions: assign({ format: ({ event }) => event.format }),
    },
  },
  states: {
    [States.INITIALIZING]: {
      always: [{ guard: ({ context }) => !context.isSandbox, target: States.READY }],
      invoke: {
        id: Actors.LOAD_INITIAL_STATE,
        src: Actors.LOAD_INITIAL_STATE,
        input: ({ context }) => ({ isSandbox: context.isSandbox }),
        onDone: { target: States.READY, actions: Actions.APPLY_INITIAL_STATE },
        onError: { target: States.READY },
      },
    },
    [States.READY]: {
      initial: States.SHARE_IDLE,
      states: {
        [States.SHARE_IDLE]: {
          on: { [MachineEvents.SHARE]: States.SHARE_COPIED },
        },
        [States.SHARE_COPIED]: {
          after: { [Delays.SHARE_RESET]: States.SHARE_IDLE },
        },
      },
    },
  },
});
