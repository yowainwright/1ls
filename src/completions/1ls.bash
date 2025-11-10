#!/bin/bash
# Bash completion for 1ls

_1ls_complete() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    # Main options
    opts="--help --version --raw --pretty --compact --type --format --list --grep --find --recursive --ignore-case --line-numbers --ext --max-depth --shortcuts --shorten --expand readFile"

    # Format options
    format_opts="json yaml csv table"

    # Common JSON path starters
    json_paths=". .[] .{keys} .{values} .{entries}"

    # Common shorthand methods
    shortcuts=".mp .flt .rd .fnd .sm .evr .srt .rvs .jn .kys .vls .ents .lc .uc .trm"

    case "${prev}" in
        --format)
            COMPREPLY=( $(compgen -W "${format_opts}" -- ${cur}) )
            return 0
            ;;
        --list|--find|readFile)
            # File/directory completion
            COMPREPLY=( $(compgen -f -- ${cur}) )
            return 0
            ;;
        --ext)
            # Common extensions
            COMPREPLY=( $(compgen -W "js ts tsx jsx json md txt yml yaml xml html css" -- ${cur}) )
            return 0
            ;;
        --shorten|--expand)
            # JSON expressions
            COMPREPLY=( $(compgen -W "${json_paths}" -- ${cur}) )
            return 0
            ;;
        *)
            ;;
    esac

    # If current word starts with -, show options
    if [[ ${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
        return 0
    fi

    # If current word starts with ., suggest JSON paths and shortcuts
    if [[ ${cur} == .* ]]; then
        all_paths="${json_paths} ${shortcuts}"
        COMPREPLY=( $(compgen -W "${all_paths}" -- ${cur}) )
        return 0
    fi

    # Default to options
    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
}

complete -F _1ls_complete 1ls