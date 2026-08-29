import { SHORTCUTS, BUILTIN_SHORTCUTS } from "../shortcuts/constants.ts";
import { BUILTIN_FUNCTIONS } from "../navigator/builtins/constants.ts";
import { VALID_INPUT_FORMATS, VALID_OUTPUT_FORMATS } from "../constants.ts";
import { CLI_FLAGS, JSON_PATH_PATTERNS } from "./constants.ts";
import type { CliFlag, JsonPathPattern } from "./constants.ts";
import type { ShortcutMapping } from "../shortcuts/types.ts";

export function getFlags(): string[] {
  return CLI_FLAGS.flatMap((f) => (f.short ? [f.long, f.short] : [f.long]));
}

export function getFormatOptions(): string[] {
  return [...VALID_OUTPUT_FORMATS];
}

export function getInputFormatOptions(): string[] {
  return [...VALID_INPUT_FORMATS];
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
  if (flag.long === "--input-format") {
    return `        '${flag.long}[${desc}]:input format:(${getInputFormatOptions().join(" ")})'`;
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

const generateZshDataBlocks = (): string => `
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
    )`;

const generateZshArgumentBlock = (): string => `
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \\
        "\${opts[@]}" \\
        '1: :->subcmd' \\
        '*:: :->args'`;

const generateZshArgsCase = (): string => `            case $words[2] in
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
            esac`;

const generateZshCaseBlock = (): string => `
    case $state in
        subcmd)
            _describe -t subcmds 'subcommands' subcmds
            ;;
        args)
${generateZshArgsCase()}
            ;;
    esac`;

export function generateZshCompletions(): string {
  const body = [generateZshDataBlocks(), generateZshArgumentBlock(), generateZshCaseBlock()].join("\n");
  return `#compdef 1ls

_1ls() {
    local -a opts shortcuts json_paths builtin_fns subcmds
${body}
}

_1ls "$@"
`;
}

const getBashCompletionValues = (): Record<string, string> => ({
  opts: [...getFlags(), "readFile"].join(" "),
  formatOpts: getFormatOptions().join(" "),
  inputFormatOpts: getInputFormatOptions().join(" "),
  jsonPaths: getJsonPaths().join(" "),
  shortcuts: getShortcutCompletions().join(" "),
  builtinFns: getBuiltinCompletions().join(" "),
});

const generateBashVariableBlock = (): string => {
  const values = getBashCompletionValues();
  return `    opts="${values.opts}"
    format_opts="${values.formatOpts}"
    input_format_opts="${values.inputFormatOpts}"
    json_paths="${values.jsonPaths}"
    shortcuts="${values.shortcuts}"
    builtin_fns="${values.builtinFns}"`;
};

const generateBashFormatCases = (): string => `        --format)
            COMPREPLY=( $(compgen -W "\${format_opts}" -- \${cur}) )
            return 0
            ;;
        --input-format|-if)
            COMPREPLY=( $(compgen -W "\${input_format_opts}" -- \${cur}) )
            return 0
            ;;`;

const generateBashFileCases = (): string => `        --list|--find|readFile)
            COMPREPLY=( $(compgen -f -- \${cur}) )
            return 0
            ;;
        --ext)
            COMPREPLY=( $(compgen -W "js ts tsx jsx json md txt yml yaml xml html css" -- \${cur}) )
            return 0
            ;;`;

const generateBashExpressionCases = (): string => `        --shorten|--expand)
            COMPREPLY=( $(compgen -W "\${json_paths}" -- \${cur}) )
            return 0
            ;;
        *)
            ;;
    esac`;

const generateBashPreviousWordCase = (): string => `    case "\${prev}" in
${generateBashFormatCases()}
${generateBashFileCases()}
${generateBashExpressionCases()}`;

const generateBashCurrentWordCases = (): string => `    if [[ \${cur} == -* ]]; then
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
    fi`;

export function generateBashCompletions(): string {
  const variableBlock = generateBashVariableBlock();
  const previousWordCase = generateBashPreviousWordCase();
  const currentWordCases = generateBashCurrentWordCases();
  return `#!/bin/bash

_1ls_complete() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

${variableBlock}

${previousWordCase}

${currentWordCases}

    COMPREPLY=( $(compgen -W "\${opts} \${builtin_fns}" -- \${cur}) )
}

complete -F _1ls_complete 1ls
`;
}
