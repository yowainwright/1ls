import type { ShortcutMapping } from "../shortcuts/index";
import { SHORTCUTS as SHARED_SHORTCUTS } from "../constants";

export const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

export const SHORTCUTS: ShortcutMapping[] = SHARED_SHORTCUTS;
