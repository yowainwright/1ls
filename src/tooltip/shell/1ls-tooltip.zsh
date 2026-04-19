#!/usr/bin/env zsh

typeset -g _1LS_FIFO_PATH="/tmp/1ls-input.fifo"
typeset -g _1LS_RESPONSE_PATH="/tmp/1ls-response"
typeset -g _1LS_TOOLTIP_ENABLED=1
typeset -g _1LS_TTY_PATH=$(tty)

_1ls_send_message() {
  [[ -p "$_1LS_FIFO_PATH" ]] || return
  local input="$1"
  local action="${2:-complete}"
  local file="${3:-}"
  local expr="${4:-}"
  local msg=""
  msg+="{\"input\":\"$input\","
  msg+="\"tty\":\"$_1LS_TTY_PATH\","
  msg+="\"action\":\"$action\","
  msg+="\"file\":\"$file\","
  msg+="\"expr\":\"$expr\"}"
  echo "$msg" > "$_1LS_FIFO_PATH"
}

_1ls_is_1ls_command() {
  [[ "$BUFFER" == 1ls\ * ]]
}

_1ls_has_partial_method() {
  [[ "$BUFFER" == *\.* ]]
}

_1ls_is_inside_parens() {
  # Count open vs close parens - if more open, we're inside
  local open="${BUFFER//[^\(]/}"
  local close="${BUFFER//[^\)]/}"
  [[ ${#open} -gt ${#close} ]]
}

_1ls_is_complete_expression() {
  local partial="${BUFFER##*.}"
  local ends_with_paren="$([[ "$partial" == *\) ]] && echo 1 || echo 0)"
  local is_length="$([[ "$partial" == "length" ]] && echo 1 || echo 0)"
  local is_keys="$([[ "$partial" == "keys" ]] && echo 1 || echo 0)"
  local is_values="$([[ "$partial" == "values" ]] && echo 1 || echo 0)"
  [[ "$ends_with_paren" -eq 1 ]] || [[ "$is_length" -eq 1 ]] || [[ "$is_keys" -eq 1 ]] || [[ "$is_values" -eq 1 ]]
}

_1ls_extract_file_and_expr() {
  # Parse: 1ls rf file.json '.expr' or 1ls file.json '.expr'
  local buffer="$1"
  local rest="${buffer#1ls }"

  # Check for rf or readFile command prefix
  if [[ "$rest" == rf\ * ]]; then
    rest="${rest#rf }"
  elif [[ "$rest" == readFile\ * ]]; then
    rest="${rest#readFile }"
  fi

  # Extract file path (first argument before space)
  local file="${rest%% *}"

  # Must have a file with extension
  [[ "$file" != *.* ]] && { echo ""; return; }

  # Get expression after file
  rest="${rest#* }"

  # Must have an expression starting with quote or dot
  [[ "$rest" != \'* && "$rest" != \"* && "$rest" != .* ]] && { echo ""; return; }

  # Remove quotes from expression
  local expr="${rest//\'/}"
  expr="${expr//\"/}"

  echo "$file|$expr"
}

_1ls_hide_tooltip() {
  [[ -p "$_1LS_FIFO_PATH" ]] || return
  echo "{\"input\":\"\",\"tty\":\"$_1LS_TTY_PATH\",\"action\":\"hide\"}" > "$_1LS_FIFO_PATH"
}

typeset -g _1LS_TOOLTIP_VISIBLE=0

_1ls_line_changed() {
  [[ $_1LS_TOOLTIP_ENABLED -eq 1 ]] || return

  # Skip if navigating tooltip (arrow keys)
  if [[ $_1LS_NAVIGATING -eq 1 ]]; then
    _1LS_NAVIGATING=0
    return
  fi

  # Not a 1ls command - hide tooltip
  if ! _1ls_is_1ls_command; then
    [[ $_1LS_TOOLTIP_VISIBLE -eq 1 ]] && _1ls_hide_tooltip
    _1LS_TOOLTIP_VISIBLE=0
    return
  fi

  # No partial method yet - hide tooltip
  if ! _1ls_has_partial_method; then
    [[ $_1LS_TOOLTIP_VISIBLE -eq 1 ]] && _1ls_hide_tooltip
    _1LS_TOOLTIP_VISIBLE=0
    return
  fi

  # Inside parens (typing arrow function body) - hide tooltip
  if _1ls_is_inside_parens; then
    [[ $_1LS_TOOLTIP_VISIBLE -eq 1 ]] && _1ls_hide_tooltip
    _1LS_TOOLTIP_VISIBLE=0
    return
  fi

  # Expression is complete (ends with ) or known property) - show preview
  if _1ls_is_complete_expression; then
    local parsed=$(_1ls_extract_file_and_expr "$BUFFER")
    if [[ -n "$parsed" ]]; then
      local file="${parsed%%|*}"
      local expr="${parsed#*|}"
      _1ls_send_message "" "preview" "$file" "$expr"
      _1LS_TOOLTIP_VISIBLE=1
    else
      [[ $_1LS_TOOLTIP_VISIBLE -eq 1 ]] && _1ls_hide_tooltip
      _1LS_TOOLTIP_VISIBLE=0
    fi
    return
  fi

  # Show tooltip for partial method at root level
  local partial="${BUFFER##*.}"
  _1ls_send_message ".$partial" "complete"
  _1LS_TOOLTIP_VISIBLE=1
}

_1ls_accept_line() {
  _1ls_hide_tooltip
  _1LS_TOOLTIP_VISIBLE=0
  zle .accept-line
}

_1ls_keyboard_quit() {
  _1ls_hide_tooltip
  _1LS_TOOLTIP_VISIBLE=0
  zle .keyboard-quit
}

typeset -g _1LS_NAVIGATING=0

_1ls_select_next() {
  if [[ $_1LS_TOOLTIP_VISIBLE -eq 1 ]]; then
    _1LS_NAVIGATING=1
    _1ls_send_message "" "next"
  else
    zle .down-line-or-history
  fi
}

_1ls_select_prev() {
  if [[ $_1LS_TOOLTIP_VISIBLE -eq 1 ]]; then
    _1LS_NAVIGATING=1
    _1ls_send_message "" "prev"
  else
    zle .up-line-or-history
  fi
}

_1ls_accept_suggestion() {
  if [[ $_1LS_TOOLTIP_VISIBLE -eq 1 ]]; then
    # Read selected suggestion from response file and insert it
    [[ -f "$_1LS_RESPONSE_PATH" ]] || return
    local response=$(cat "$_1LS_RESPONSE_PATH")
    local selected=$(echo "$response" | sed 's/.*"selected":"\([^"]*\)".*/\1/')
    if [[ -n "$selected" && "$selected" != "$response" ]]; then
      # Replace partial method with selected signature
      local before_dot="${BUFFER%.*}"
      BUFFER="${before_dot}${selected}"
      CURSOR=${#BUFFER}
      _1ls_hide_tooltip
      _1LS_TOOLTIP_VISIBLE=0
    fi
  else
    zle .forward-char
  fi
}

autoload -Uz add-zle-hook-widget

zle -N _1ls_accept_line
zle -N _1ls_keyboard_quit
zle -N _1ls_select_next
zle -N _1ls_select_prev
zle -N _1ls_accept_suggestion

add-zle-hook-widget line-pre-redraw _1ls_line_changed

bindkey '^M' _1ls_accept_line
bindkey '^C' _1ls_keyboard_quit

# Arrow keys (both CSI and SS3 formats)
bindkey '^[[B' _1ls_select_next     # Down arrow (CSI)
bindkey '^[OB' _1ls_select_next     # Down arrow (SS3)
bindkey '^[[A' _1ls_select_prev     # Up arrow (CSI)
bindkey '^[OA' _1ls_select_prev     # Up arrow (SS3)
bindkey '^[[C' _1ls_accept_suggestion  # Right arrow (CSI)
bindkey '^[OC' _1ls_accept_suggestion  # Right arrow (SS3)

# Tab alternatives
bindkey '^I' _1ls_select_next       # Tab
bindkey '^[[Z' _1ls_select_prev     # Shift-Tab
bindkey '^L' _1ls_accept_suggestion # Ctrl-L to accept

1ls-debug-bindings() {
  echo "Checking 1ls keybindings..."
  bindkey | grep -E "_1ls_select|_1ls_accept"
  echo ""
  echo "Tooltip visible: $_1LS_TOOLTIP_VISIBLE"
  echo "Navigating: $_1LS_NAVIGATING"
}

1ls-daemon-start() {
  if [[ -p "$_1LS_FIFO_PATH" ]]; then
    echo "1ls daemon already running"
    return 0
  fi

  if command -v 1ls &>/dev/null; then
    1ls --daemon &
  else
    bun run src/tooltip/index.ts &
  fi
  disown
  echo "1ls daemon started"
}

1ls-daemon-stop() {
  if [[ -p "$_1LS_FIFO_PATH" ]]; then
    rm -f "$_1LS_FIFO_PATH" "$_1LS_RESPONSE_PATH"
    pkill -f "1ls.*daemon" 2>/dev/null
    echo "1ls daemon stopped"
  else
    echo "1ls daemon not running"
  fi
}

1ls-tooltip-toggle() {
  if [[ $_1LS_TOOLTIP_ENABLED -eq 1 ]]; then
    _1LS_TOOLTIP_ENABLED=0
    echo "1ls tooltips disabled"
  else
    _1LS_TOOLTIP_ENABLED=1
    echo "1ls tooltips enabled"
  fi
}
