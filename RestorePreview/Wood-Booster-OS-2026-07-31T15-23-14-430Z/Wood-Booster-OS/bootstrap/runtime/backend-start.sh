#!/bin/bash

echo "🛰️ Starting Wood-Booster backend"


PROJECT="$HOME/Wood-Booster-AI/Wood-Booster-OS/server"


cd "$PROJECT" || exit 1


npm start
