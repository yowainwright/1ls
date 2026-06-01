#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$ROOT_DIR/dist/qjs"

mkdir -p "$OUT_DIR"
mkdir -p "$ROOT_DIR/bin"

echo "Building QuickJS terminal bundle..."

bun build "$ROOT_DIR/src/qjs/shared.ts" \
  --outfile "$OUT_DIR/shared.js" \
  --target browser \
  --minify \
  --format esm

cp "$ROOT_DIR/src/qjs/cli.js" "$OUT_DIR/cli.js"

echo "Bundle created at $OUT_DIR"
echo "  - shared.js (shared terminal CLI core)"
echo "  - cli.js (QuickJS host entry point)"

if command -v qjsc &> /dev/null; then
  echo ""
  echo "Compiling to native binary..."
  qjsc -m -o "$ROOT_DIR/bin/1ls-qjs" "$OUT_DIR/cli.js"
  echo "Binary created at bin/1ls-qjs"
else
  echo ""
  echo "Note: qjsc not found. Install QuickJS to compile native binary:"
  echo "  brew install quickjs"
  if [[ "${CI:-}" == "true" || "${REQUIRE_QJS:-}" == "1" ]]; then
    exit 1
  fi
fi
