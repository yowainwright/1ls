import type { ShortcutMapping } from "../utils/types";
import { SHORTCUTS as SHARED_SHORTCUTS } from "../shared/constants";

export const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

export const SHORTCUTS: ShortcutMapping[] = SHARED_SHORTCUTS;
