#!/usr/bin/env bash

set -e

echo "📦 Building Debian package"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

npm run tauri build -- --bundles deb

echo "✅ Debian package ready"

ls -lh "$PROJECT_ROOT/src-tauri/target/release/bundle/deb"
