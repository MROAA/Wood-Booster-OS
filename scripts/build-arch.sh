#!/usr/bin/env bash

set -e

echo "📦 Building Arch package"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT/src-tauri/packaging/arch"

rm -rf pkg src

makepkg -f

echo "✅ Arch package ready"
