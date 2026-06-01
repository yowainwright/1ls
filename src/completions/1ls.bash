#!/bin/bash

_1ls_complete() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    opts="--help -h --version -v --raw -r --pretty -p --compact -c --type -t --format --input-format -if --detect --list -l --grep -g --find -f --recursive -R --ignore-case -i --line-numbers -n --ext --max-depth --shortcuts --shorten --expand --strict -s --slurp -S --null-input -N --interactive readFile"
    format_opts="json yaml csv table"
    json_paths=". .[] .. .{keys} .{values} .{entries} .foo? .foo ?? default"
    shortcuts=".mp .flt .rd .fnd .fndIdx .sm .evr .srt .rvs .jn .slc .splt .psh .pp .shft .unshft .fltMap .flt1 .incl .idxOf .kys .vls .ents .len .lc .uc .trm .trmSt .trmEnd .rpl .rplAll .pdSt .pdEnd .stsWith .endsWith .sbstr .chr .chrCd .mtch .str .json .val"
    builtin_fns="pipe compose head last tail take drop uniq flatten rev groupBy sortBy chunk compact pick omit keys vals merge deepMerge fromPairs toPairs sum mean min max len count isEmpty isNil id pluck type range has nth contains add path getpath setpath recurse split join startswith endswith ltrimstr rtrimstr tostring tonumber floor ceil round abs not select empty error debug hd lst tl tk drp unq fltn grpBy srtBy chnk cmpct pk omt ks mrg dMrg frPrs toPrs avg cnt emp nil plk typ rng hs ctns pth gpth spth rec spl jn stw edw ltrm rtrm tstr tnum flr cl rnd sel dbg"

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
        COMPREPLY=( $(compgen -W "${builtin_fns}" -- ${cur}) )
        return 0
    fi

    COMPREPLY=( $(compgen -W "${opts} ${builtin_fns}" -- ${cur}) )
}

complete -F _1ls_complete 1ls
