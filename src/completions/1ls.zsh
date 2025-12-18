#compdef 1ls

_1ls() {
    local -a opts format_opts shortcuts json_paths

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
        '--slurp[Read all inputs into array]'
        '--null-input[Use null as input]'
        'readFile[Read from file]:file:_files'
    )

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

    builtins=(
        'head:hd - First element'
        'last:lst - Last element'
        'tail:tl - All but first'
        'take:tk - Take n elements'
        'drop:drp - Drop n elements'
        'uniq:unq - Unique values'
        'flatten:fltn - Flatten nested'
        'rev:Reverse array'
        'groupBy:grpBy - Group by key'
        'sortBy:srtBy - Sort by key'
        'chunk:chnk - Split into chunks'
        'compact:cmpct - Remove falsy'
        'pick:pk - Pick keys'
        'omit:omt - Omit keys'
        'keys:ks - Object keys'
        'vals:Object values'
        'merge:mrg - Shallow merge'
        'deepMerge:dMrg - Deep merge'
        'fromPairs:frPrs - Pairs to object'
        'toPairs:toPrs - Object to pairs'
        'sum:Sum array'
        'mean:avg - Average'
        'min:Minimum'
        'max:Maximum'
        'len:Length'
        'count:cnt - Count items'
        'isEmpty:emp - Check if empty'
        'isNil:nil - Check if null/undefined'
        'pluck:plk - Extract property'
        'pipe:Compose left-to-right'
        'compose:Compose right-to-left'
        'id:Identity function'
        'type:typ - Get value type'
        'range:rng - Generate range'
        'has:hs - Check if key exists'
        'nth:Get nth element'
        'contains:ctns - Check if contains'
        'add:Concat/sum values'
        'path:pth - Get all paths'
        'getpath:gpth - Get value at path'
        'setpath:spth - Set value at path'
        'recurse:rec - Recurse all values'
        'split:spl - Split string'
        'join:jn - Join array'
        'startswith:stw - Check prefix'
        'endswith:edw - Check suffix'
        'ltrimstr:ltrm - Trim prefix'
        'rtrimstr:rtrm - Trim suffix'
        'tostring:tstr - Convert to string'
        'tonumber:tnum - Convert to number'
        'floor:flr - Floor number'
        'ceil:cl - Ceil number'
        'round:rnd - Round number'
        'abs:Absolute value'
        'not:Boolean negation'
        'select:sel - Filter by predicate'
        'empty:Return nothing'
        'error:Throw error'
        'debug:dbg - Debug output'
    )

    json_paths=(
        '.:Root object'
        '.[]:All array elements'
        '..:Recursive descent'
        '.{keys}:Object keys'
        '.{values}:Object values'
        '.{entries}:Object entries'
        '.foo?:Optional access'
        '.foo ?? default:Null coalescing'
    )

    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \
        "${opts[@]}" \
        '*:: :->args'

    case $state in
        args)
            if [[ $words[$CURRENT] == .* ]]; then
                _describe -t shortcuts 'shortcuts' shortcuts
                _describe -t paths 'json paths' json_paths
            else
                _describe -t builtins 'builtin functions' builtins
                _arguments "${opts[@]}"
            fi
            ;;
    esac
}

_1ls "$@"
