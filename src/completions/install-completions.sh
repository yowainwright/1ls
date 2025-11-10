#!/bin/bash

echo "Installing 1ls shell completions..."

# Detect shell
if [ -n "$BASH_VERSION" ]; then
    SHELL_NAME="bash"
elif [ -n "$ZSH_VERSION" ]; then
    SHELL_NAME="zsh"
else
    echo "Unsupported shell. Only bash and zsh are supported."
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "$SHELL_NAME" = "bash" ]; then
    # Bash installation
    if [ -d "$HOME/.bash_completion.d" ]; then
        cp "$SCRIPT_DIR/1ls.bash" "$HOME/.bash_completion.d/"
        echo "Installed to ~/.bash_completion.d/"
        echo "Add this to your ~/.bashrc if not already present:"
        echo "  source ~/.bash_completion.d/1ls.bash"
    elif [ -f "$HOME/.bashrc" ]; then
        echo "" >> "$HOME/.bashrc"
        echo "# 1ls completions" >> "$HOME/.bashrc"
        echo "source $SCRIPT_DIR/1ls.bash" >> "$HOME/.bashrc"
        echo "Added to ~/.bashrc"
    else
        echo "Could not find suitable location for bash completions"
        echo "Please manually source: $SCRIPT_DIR/1ls.bash"
    fi
elif [ "$SHELL_NAME" = "zsh" ]; then
    # Zsh installation
    if [ -d "$HOME/.zsh/completions" ]; then
        cp "$SCRIPT_DIR/1ls.zsh" "$HOME/.zsh/completions/_1ls"
        echo "Installed to ~/.zsh/completions/"
    elif [ -d "/usr/local/share/zsh/site-functions" ]; then
        cp "$SCRIPT_DIR/1ls.zsh" "/usr/local/share/zsh/site-functions/_1ls"
        echo "Installed to /usr/local/share/zsh/site-functions/"
    else
        mkdir -p "$HOME/.zsh/completions"
        cp "$SCRIPT_DIR/1ls.zsh" "$HOME/.zsh/completions/_1ls"
        echo "Installed to ~/.zsh/completions/"
        echo "Add this to your ~/.zshrc if not already present:"
        echo "  fpath=(~/.zsh/completions \$fpath)"
        echo "  autoload -U compinit && compinit"
    fi
fi

echo "Reload your shell or run 'source ~/.${SHELL_NAME}rc' to enable completions"