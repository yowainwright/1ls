#!/bin/bash

_1ls_complete() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    opts="--help --version --raw --pretty --compact --type --format --list --grep --find --recursive --ignore-case --line-numbers --ext --max-depth --shortcuts --shorten --expand --slurp --null-input readFile"
    format_opts="json yaml csv table"
    json_paths=". .[] .. .{keys} .{values} .{entries}"
    shortcuts=".mp .flt .rd .fnd .sm .evr .srt .rvs .jn .kys .vls .ents .lc .uc .trm"
    builtins="head hd last lst tail tl take tk drop drp uniq unq flatten fltn rev groupBy grpBy sortBy srtBy chunk chnk compact cmpct pick pk omit omt keys ks vals merge mrg deepMerge dMrg fromPairs frPrs toPairs toPrs sum mean avg min max len count cnt isEmpty emp isNil nil pluck plk pipe compose id type typ range rng has hs nth contains ctns add path pth getpath gpth setpath spth recurse rec split spl join jn startswith stw endswith edw ltrimstr ltrm rtrimstr rtrm tostring tstr tonumber tnum floor flr ceil cl round rnd abs not select sel empty error debug dbg"

    case "${prev}" in
        --format)
            COMPREPLY=( $(compgen -W "${format_opts}" -- ${cur}) )
            return 0
            ;;
        --list|--find|readFile)
            COMPREPLY=( $(compgen -f -- ${cur}) )
            return 0
            ;;
        --ext)
            COMPREPLY=( $(compgen -W "js ts tsx jsx json md txt yml yaml xml html css" -- ${cur}) )
            return 0
            ;;
        --shorten|--expand)
            COMPREPLY=( $(compgen -W "${json_paths}" -- ${cur}) )
            return 0
            ;;
        *)
            ;;
    esac

    if [[ ${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
        return 0
    fi

    if [[ ${cur} == .* ]]; then
        all_paths="${json_paths} ${shortcuts}"
        COMPREPLY=( $(compgen -W "${all_paths}" -- ${cur}) )
        return 0
    fi

    if [[ ${cur} =~ ^[a-zA-Z] ]]; then
        COMPREPLY=( $(compgen -W "${builtins}" -- ${cur}) )
        return 0
    fi

    COMPREPLY=( $(compgen -W "${opts} ${builtins}" -- ${cur}) )
}

complete -F _1ls_complete 1ls
