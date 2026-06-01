#!/usr/bin/env bash

set -euo pipefail

# Resolve project root relative to this script's location
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Allow overrides via env vars (used by tests)
SKILLS_SRC="${SKILLS_SRC:-"$PROJECT_ROOT/skills"}"
INSTALL_DIR="${INSTALL_DIR:-"$PROJECT_ROOT/.claude"}"
CODEX_DEST="${CODEX_DEST:-"$PROJECT_ROOT/.codex/AGENTS.md"}"

CLAUDE_DEST="$INSTALL_DIR/skills"

# --- functions ---

log() {
  echo "$1"
}

err() {
  echo "Error: $1" >&2
  return 1
}

check_skills_src() {
  [ -d "$SKILLS_SRC" ] || err "skills/ not found at $SKILLS_SRC"
}

ensure_dir() {
  local dir="$1"
  mkdir -p "$dir"
}

copy_skills() {
  local src="$1"
  local dest="$2"
  cp -r "$src/." "$dest/"
}

install_claude() {
  ensure_dir "$CLAUDE_DEST"
  copy_skills "$SKILLS_SRC" "$CLAUDE_DEST"
  log "✓ Skills installed to $CLAUDE_DEST"
}

install_codex() {
  ensure_dir "$(dirname "$CODEX_DEST")"
  cp "$SKILLS_SRC/agents.md" "$CODEX_DEST"
  log "✓ AGENTS.md installed to $CODEX_DEST"
}

main() {
  check_skills_src
  install_claude
  install_codex
}

# Run only when executed directly, not sourced
[[ "${BASH_SOURCE[0]}" == "${0}" ]] && main "$@"
