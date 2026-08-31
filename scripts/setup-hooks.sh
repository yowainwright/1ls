#!/bin/bash

# Setup git hooks for 1ls project
# This script creates git hooks if they don't already exist

set -e

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: Not in a git repository"
  exit 1
fi

HOOKS_DIR="$(git rev-parse --git-path hooks)"
PRE_COMMIT="$HOOKS_DIR/pre-commit"
POST_CHECKOUT="$HOOKS_DIR/post-checkout"

echo "Setting up git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

cat > "$PRE_COMMIT" << 'EOF'
#!/bin/sh
set -e
CI=true pnpm run lint
CI=true pnpm run typecheck
CI=true pnpm test
EOF
chmod +x "$PRE_COMMIT"
echo "✓ Installed pre-commit hook"

# Setup post-checkout hook
cat > "$POST_CHECKOUT" << 'EOF'
#!/bin/sh
exit 0
EOF
chmod +x "$POST_CHECKOUT"
echo "✓ Installed post-checkout hook"

echo "Git hooks setup complete!"
