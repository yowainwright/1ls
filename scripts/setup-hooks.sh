#!/bin/bash

# Setup git hooks for 1ls project
# This script creates git hooks if they don't already exist

set -e

HOOKS_DIR=".git/hooks"
PRE_COMMIT="$HOOKS_DIR/pre-commit"
POST_CHECKOUT="$HOOKS_DIR/post-checkout"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "Error: Not in a git repository"
  exit 1
fi

echo "Setting up git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Setup pre-commit hook
if [ -f "$PRE_COMMIT" ]; then
  echo "pre-commit hook already exists, skipping..."
else
  cat > "$PRE_COMMIT" << 'EOF'
#!/bin/sh
bun run lint
bun run build
bun test
EOF
  chmod +x "$PRE_COMMIT"
  echo "✓ Created pre-commit hook"
fi

# Setup post-checkout hook
if [ -f "$POST_CHECKOUT" ]; then
  echo "post-checkout hook already exists, skipping..."
else
  cat > "$POST_CHECKOUT" << 'EOF'
#!/bin/sh
# Check if current branch has a remote tracking branch
if git rev-parse --abbrev-ref @{upstream} >/dev/null 2>&1; then
  git pull
fi
bun install
EOF
  chmod +x "$POST_CHECKOUT"
  echo "✓ Created post-checkout hook"
fi

echo "Git hooks setup complete!"
