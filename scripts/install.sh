#!/bin/bash
set -e

REPO="yowainwright/1ls"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="1ls"

get_latest_release() {
  curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
}

get_platform() {
  local os arch
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)

  case "$os" in
    darwin) os="darwin" ;;
    linux) os="linux" ;;
    *)
      echo "Unsupported OS: $os" >&2
      exit 1
      ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *)
      echo "Unsupported architecture: $arch" >&2
      exit 1
      ;;
  esac

  if [ "$os" = "linux" ] && [ "$arch" = "arm64" ]; then
    echo "Linux arm64 not available, falling back to x64" >&2
    arch="x64"
  fi

  echo "${os}-${arch}"
}

main() {
  echo "Installing 1ls..."

  local version platform download_url tmp_file

  version=$(get_latest_release)
  if [ -z "$version" ]; then
    echo "Failed to get latest release version" >&2
    exit 1
  fi
  echo "Latest version: $version"

  platform=$(get_platform)
  echo "Platform: $platform"

  download_url="https://github.com/$REPO/releases/download/$version/$BINARY_NAME-qjs-$platform"
  echo "Downloading from: $download_url"

  tmp_file=$(mktemp)
  trap 'rm -f "$tmp_file"' EXIT

  if ! curl -fsSL "$download_url" -o "$tmp_file"; then
    echo "Failed to download binary" >&2
    exit 1
  fi

  chmod +x "$tmp_file"

  if [ -w "$INSTALL_DIR" ]; then
    mv "$tmp_file" "$INSTALL_DIR/$BINARY_NAME"
  else
    echo "Installing to $INSTALL_DIR (requires sudo)..."
    sudo mv "$tmp_file" "$INSTALL_DIR/$BINARY_NAME"
  fi

  echo "Successfully installed 1ls to $INSTALL_DIR/$BINARY_NAME"
  echo "Run '1ls --help' to get started"
}

main
