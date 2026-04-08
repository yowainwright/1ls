import { SHORTCUTS, BUILTIN_SHORTCUTS } from "../shortcuts/constants";
import { BUILTIN_FUNCTIONS } from "../navigator/builtins/constants";
import { VALID_OUTPUT_FORMATS } from "../constants";
import { CLI_FLAGS, JSON_PATH_PATTERNS } from "./constants";
import type { CliFlag, JsonPathPattern } from "./constants";
import type { ShortcutMapping } from "../shortcuts/types";

export function getFlags(): string[] {
  return CLI_FLAGS.flatMap((f) => (f.short ? [f.long, f.short] : [f.long]));
}

export function getFormatOptions(): string[] {
  return [...VALID_OUTPUT_FORMATS];
}

export function getJsonPaths(): string[] {
  return JSON_PATH_PATTERNS.map((p) => p.pattern);
}

export function getShortcutCompletions(): string[] {
  return SHORTCUTS.map((s) => s.short);
}

export function getBuiltinCompletions(): string[] {
  const builtinFns = Object.values(BUILTIN_FUNCTIONS);
  const shortcutShorts = BUILTIN_SHORTCUTS.map((s) => s.short);
  return [...new Set([...builtinFns, ...shortcutShorts])];
}

export function formatZshFlag(flag: CliFlag): string {
  const desc = flag.description.replace(/'/g, "\\'");
  if (flag.long === "--format") {
    return `        '${flag.long}[${desc}]:format:(${getFormatOptions().join(" ")})'`;
  }
  if (flag.long === "--list") {
    return `        '${flag.long}[${desc}]:directory:_files -/'`;
  }
  if (flag.long === "--find") {
    return `        '${flag.long}[${desc}]:path:_files'`;
  }
  return `        '${flag.long}[${desc}]'`;
}

export function formatZshShortcut(s: ShortcutMapping): string {
  return `        '${s.short}:${s.full} - ${s.description}'`;
}

export function formatZshBuiltin(fn: string): string {
  const alias = BUILTIN_SHORTCUTS.find((s) => s.full === fn);
  const desc = alias ? `${alias.short} - ${alias.description}` : fn;
  return `        '${fn}:${desc}'`;
}

export function formatZshPath(p: JsonPathPattern): string {
  return `        '${p.pattern}:${p.description}'`;
}

export function generateZshOptsBlock(): string {
  return CLI_FLAGS.map(formatZshFlag).join("\n");
}

export function generateZshShortcutsBlock(): string {
  return SHORTCUTS.map(formatZshShortcut).join("\n");
}

export function generateZshBuiltinsBlock(): string {
  return Object.values(BUILTIN_FUNCTIONS).map(formatZshBuiltin).join("\n");
}

export function generateZshPathsBlock(): string {
  return JSON_PATH_PATTERNS.map(formatZshPath).join("\n");
}

export function generateZshCompletions(): string {
  return `#compdef 1ls

_1ls() {
    local -a opts shortcuts json_paths builtin_fns subcmds

    opts=(
${generateZshOptsBlock()}
    )

    subcmds=(
        'readFile:Read from file'
    )

    shortcuts=(
${generateZshShortcutsBlock()}
    )

    builtin_fns=(
${generateZshBuiltinsBlock()}
    )

    json_paths=(
${generateZshPathsBlock()}
    )

    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \\
        "\${opts[@]}" \\
        '1: :->subcmd' \\
        '*:: :->args'

    case $state in
        subcmd)
            _describe -t subcmds 'subcommands' subcmds
            ;;
        args)
            case $words[1] in
                readFile)
                    _files
                    ;;
                *)
                    if [[ $words[$CURRENT] == .* ]]; then
                        _describe -t shortcuts 'shortcuts' shortcuts
                        _describe -t paths 'json paths' json_paths
                    else
                        _describe -t builtin_fns 'builtin functions' builtin_fns
                    fi
                    ;;
            esac
            ;;
    esac
}

_1ls "$@"
`;
}

export function generateBashCompletions(): string {
  const opts = [...getFlags(), "readFile"].join(" ");
  const formatOpts = getFormatOptions().join(" ");
  const jsonPaths = getJsonPaths().join(" ");
  const shortcuts = getShortcutCompletions().join(" ");
  const builtinFns = getBuiltinCompletions().join(" ");

  return `#!/bin/bash

_1ls_complete() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    opts="${opts}"
    format_opts="${formatOpts}"
    json_paths="${jsonPaths}"
    shortcuts="${shortcuts}"
    builtin_fns="${builtinFns}"

    case "\${prev}" in
        --format)
            COMPREPLY=( $(compgen -W "\${format_opts}" -- \${cur}) )
            return 0
            ;;
        --list|--find|readFile)
            COMPREPLY=( $(compgen -f -- \${cur}) )
            return 0
            ;;
        --ext)
            COMPREPLY=( $(compgen -W "js ts tsx jsx json md txt yml yaml xml html css" -- \${cur}) )
            return 0
            ;;
        --shorten|--expand)
            COMPREPLY=( $(compgen -W "\${json_paths}" -- \${cur}) )
            return 0
            ;;
        *)
            ;;
    esac

    if [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
        return 0
    fi

    if [[ \${cur} == .* ]]; then
        all_paths="\${json_paths} \${shortcuts}"
        COMPREPLY=( $(compgen -W "\${all_paths}" -- \${cur}) )
        return 0
    fi

    if [[ \${cur} =~ ^[a-zA-Z] ]]; then
        COMPREPLY=( $(compgen -W "\${builtin_fns}" -- \${cur}) )
        return 0
    fi

    COMPREPLY=( $(compgen -W "\${opts} \${builtin_fns}" -- \${cur}) )
}

complete -F _1ls_complete 1ls
`;
}
