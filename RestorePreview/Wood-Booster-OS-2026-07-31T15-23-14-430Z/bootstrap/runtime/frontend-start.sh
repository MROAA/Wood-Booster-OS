#!/bin/bash

echo "🛰️ Starting Wood-Booster frontend"


PROJECT="$HOME/Wood-Booster-AI/Wood-Booster-OS"


cd "$PROJECT" || exit 1


npm run dev
