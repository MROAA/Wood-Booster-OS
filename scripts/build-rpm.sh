#!/usr/bin/env bash

set -e

echo "📦 Building RPM package"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

npm run tauri build -- --bundles rpm

echo "✅ RPM package ready"

ls -lh "$PROJECT_ROOT/src-tauri/target/release/bundle/rpm"
