import type { ShortcutMapping } from "../shortcuts/index.ts";
import { SHORTCUTS as SHARED_SHORTCUTS } from "../constants.ts";

export const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

export const SHORTCUTS: ShortcutMapping[] = SHARED_SHORTCUTS;
