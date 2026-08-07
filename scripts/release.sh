#!/usr/bin/env bash

set -e

echo "🚀 Wood-Booster OS release builder"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"


echo ""
echo "1/3 Building Tauri packages"

npm run tauri build


echo ""
echo "2/3 Building Arch package"

./scripts/build-arch.sh


echo ""
echo "3/3 Collecting release packages"

./scripts/package-all.sh


echo ""
echo "🎉 Wood-Booster OS release ready"

ls -lh release
