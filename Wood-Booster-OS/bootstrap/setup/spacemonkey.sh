#!/bin/bash

echo "🛰️ Setting up Spacemonkey"


PROJECT="$HOME/Wood-Booster-AI/Wood-Booster-OS"


if [ ! -d "$PROJECT" ]; then

    echo "❌ Wood-Booster OS missing"

    exit 1

fi


echo ""

echo "Checking AI Brain..."


if [ -d "$PROJECT/server/services/aiBrainV2" ]; then

    echo "✅ AI Brain found"

else

    echo "❌ AI Brain missing"

fi


echo ""

echo "Checking Spacemonkey..."


if [ -d "$PROJECT/server/services/aiBrainV2/system/spacemonkey" ]; then

    echo "✅ Spacemonkey core found"

else

    echo "❌ Spacemonkey missing"

fi


echo ""

echo "Checking Godfiles..."


if [ -d "$PROJECT/server/services/aiBrainV2/system/spacemonkey/godfiles" ]; then

    echo "✅ Godfiles found"

else

    echo "❌ Godfiles missing"

fi


echo ""

echo "🛰️ Spacemonkey setup completed"
