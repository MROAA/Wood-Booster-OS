#!/usr/bin/env bash

set -e

echo "🪵 Building Wood-Booster OS application"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

npm run build

cd src-tauri

cargo build --release

echo "✅ Tauri application build complete"
