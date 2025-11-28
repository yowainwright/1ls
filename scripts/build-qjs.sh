#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$ROOT_DIR/dist/qjs"

VERSION=$(node -p "require('$ROOT_DIR/package.json').version")

mkdir -p "$OUT_DIR"
mkdir -p "$ROOT_DIR/bin"

echo "Building QuickJS bundle (v$VERSION)..."

bun build "$ROOT_DIR/src/browser/index.ts" \
  --outfile "$OUT_DIR/core.js" \
  --target browser \
  --minify \
  --format esm

cp "$ROOT_DIR/src/qjs/cli.js" "$OUT_DIR/cli.js"
cp "$ROOT_DIR/src/qjs/constants.js" "$OUT_DIR/constants.js"

sed -i '' "s/__VERSION__/$VERSION/g" "$OUT_DIR/constants.js"

echo "Bundle created at $OUT_DIR"
echo "  - core.js (evaluate function)"
echo "  - cli.js (CLI entry point)"
echo "  - constants.js (version: $VERSION)"

if command -v qjsc &> /dev/null; then
  echo ""
  echo "Compiling to native binary..."
  qjsc -m -o "$ROOT_DIR/bin/1ls-qjs" "$OUT_DIR/cli.js"
  echo "Binary created at bin/1ls-qjs"
else
  echo ""
  echo "Note: qjsc not found. Install QuickJS to compile native binary:"
  echo "  brew install quickjs"
fi
