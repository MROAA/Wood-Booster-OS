#!/bin/bash

echo "🛰️ Starting Spacemonkey"

echo ""

echo "Checking Spacemonkey core..."


PROJECT="$HOME/Wood-Booster-AI/Wood-Booster-OS"


if [ -d "$PROJECT/server/services/aiBrainV2/system/spacemonkey" ]; then

    echo "✅ Spacemonkey core available"

else

    echo "❌ Spacemonkey missing"

    exit 1

fi


echo ""

echo "🛰️ Spacemonkey ready"
