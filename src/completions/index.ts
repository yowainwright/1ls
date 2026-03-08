import { SHORTCUTS, BUILTIN_SHORTCUTS } from "../shortcuts/constants";
import { BUILTIN_FUNCTIONS } from "../navigator/builtins/constants";
import { VALID_OUTPUT_FORMATS } from "../constants";
import { CLI_FLAGS, JSON_PATH_PATTERNS } from "./constants";

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

export function generateBashCompletions(): string {
  const opts = [...getFlags(), "readFile"].join(" ");
  const formatOpts = getFormatOptions().join(" ");
  const jsonPaths = getJsonPaths().join(" ");
  const shortcuts = getShortcutCompletions().join(" ");
  const builtins = getBuiltinCompletions().join(" ");

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
    builtins="${builtins}"

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
        COMPREPLY=( $(compgen -W "\${builtins}" -- \${cur}) )
        return 0
    fi

    COMPREPLY=( $(compgen -W "\${opts} \${builtins}" -- \${cur}) )
}

complete -F _1ls_complete 1ls
`;
}

export function generateZshCompletions(): string {
  const optsLines = CLI_FLAGS.map((f) => {
    const desc = f.description.replace(/'/g, "\\'");
    if (f.long === "--format") {
      return `        '${f.long}[${desc}]:format:(${getFormatOptions().join(" ")})'`;
    }
    if (f.long === "--list") {
      return `        '${f.long}[${desc}]:directory:_files -/'`;
    }
    if (f.long === "--find") {
      return `        '${f.long}[${desc}]:path:_files'`;
    }
    return `        '${f.long}[${desc}]'`;
  }).join("\n");

  const shortcutLines = SHORTCUTS.map(
    (s) => `        '${s.short}:${s.full} - ${s.description}'`,
  ).join("\n");

  const builtinFns = Object.values(BUILTIN_FUNCTIONS);
  const builtinShortcuts = BUILTIN_SHORTCUTS;
  const builtinLines = builtinFns.map((fn) => {
    const alias = builtinShortcuts.find((s) => s.full === fn);
    const desc = alias ? `${alias.short} - ${alias.description}` : fn;
    return `        '${fn}:${desc}'`;
  }).join("\n");

  const jsonPathLines = JSON_PATH_PATTERNS.map(
    (p) => `        '${p.pattern}:${p.description}'`,
  ).join("\n");

  return `#compdef 1ls

_1ls() {
    local -a opts format_opts shortcuts json_paths

    opts=(
${optsLines}
        'readFile[Read from file]:file:_files'
    )

    shortcuts=(
${shortcutLines}
    )

    builtins=(
${builtinLines}
    )

    json_paths=(
${jsonPathLines}
    )

    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \\
        "\${opts[@]}" \\
        '*:: :->args'

    case $state in
        args)
            if [[ $words[$CURRENT] == .* ]]; then
                _describe -t shortcuts 'shortcuts' shortcuts
                _describe -t paths 'json paths' json_paths
            else
                _describe -t builtins 'builtin functions' builtins
                _arguments "\${opts[@]}"
            fi
            ;;
    esac
}

_1ls "$@"
`;
}
