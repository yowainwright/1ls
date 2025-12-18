#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
README="$ROOT_DIR/README.md"
DOCS_BENCHMARKS="$ROOT_DIR/app/src/content/docs/benchmarks.mdx"

if [ -n "$1" ] && [ -f "$1" ]; then
    echo "Using cached results from $1"
    RESULTS=$(cat "$1")
else
    echo "Running benchmarks..."
    RESULTS=$(docker build -f "$SCRIPT_DIR/Dockerfile" -t 1ls-bench "$ROOT_DIR" && docker run --rm 1ls-bench)
fi

echo "Updating README.md..."
START_MARKER="<!-- BENCHMARKS:START -->"
END_MARKER="<!-- BENCHMARKS:END -->"

BEFORE=$(sed -n "1,/$START_MARKER/p" "$README")
AFTER=$(sed -n "/$END_MARKER/,\$p" "$README")

cat > "$README" << EOF
${BEFORE}
${RESULTS}

${AFTER}
EOF

echo "Updating docs site..."
mkdir -p "$(dirname "$DOCS_BENCHMARKS")"
cat > "$DOCS_BENCHMARKS" << EOF
${RESULTS}
EOF

echo "Done! Benchmarks updated in:"
echo "  - $README"
echo "  - $DOCS_BENCHMARKS"
