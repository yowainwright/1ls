#compdef 1ls
# Zsh completion for 1ls

_1ls() {
    local -a opts format_opts shortcuts json_paths

    # Main options
    opts=(
        '--help[Show help]'
        '--version[Show version]'
        '--raw[Raw output (no formatting)]'
        '--pretty[Pretty print JSON]'
        '--compact[Compact JSON]'
        '--type[Show value type info]'
        '--format[Output format]:format:(json yaml csv table)'
        '--list[List files in directory]:directory:_files -/'
        '--grep[Search for pattern]:pattern:'
        '--find[Path to search in]:path:_files'
        '--recursive[Recursive search]'
        '--ignore-case[Case insensitive search]'
        '--line-numbers[Show line numbers]'
        '--ext[Filter by extensions]:extensions:'
        '--max-depth[Maximum recursion depth]:depth:'
        '--shortcuts[Show all available shortcuts]'
        '--shorten[Convert expression to shorthand]:expression:'
        '--expand[Convert shorthand to full form]:expression:'
        'readFile[Read from file]:file:_files'
    )

    # Common shorthand methods
    shortcuts=(
        '.mp:map - Transform each element'
        '.flt:filter - Filter elements'
        '.rd:reduce - Reduce to single value'
        '.fnd:find - Find first match'
        '.sm:some - Test if any match'
        '.evr:every - Test if all match'
        '.srt:sort - Sort elements'
        '.rvs:reverse - Reverse order'
        '.jn:join - Join to string'
        '.kys:keys - Get object keys'
        '.vls:values - Get object values'
        '.ents:entries - Get object entries'
        '.lc:toLowerCase - Convert to lowercase'
        '.uc:toUpperCase - Convert to uppercase'
        '.trm:trim - Remove whitespace'
    )

    # JSON path examples
    json_paths=(
        '.:Root object'
        '.[]:All array elements'
        '.{keys}:Object keys'
        '.{values}:Object values'
        '.{entries}:Object entries'
    )

    # Check context and provide appropriate completions
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \
        "${opts[@]}" \
        '*:: :->args'

    case $state in
        args)
            # If typing starts with ., offer shortcuts and paths
            if [[ $words[$CURRENT] == .* ]]; then
                _describe -t shortcuts 'shortcuts' shortcuts
                _describe -t paths 'json paths' json_paths
            else
                _arguments "${opts[@]}"
            fi
            ;;
    esac
}

_1ls "$@"