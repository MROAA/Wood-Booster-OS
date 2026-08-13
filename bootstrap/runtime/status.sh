#!/bin/bash


echo "🛰️ Wood-Booster Runtime Status"
echo "================================"


echo ""


PROJECT="$HOME/Wood-Booster-AI/Wood-Booster-OS"



echo "Checking Backend..."

if [ -d "$PROJECT/server" ]; then

    echo "✅ Backend available"

else

    echo "❌ Backend missing"

fi



echo ""


echo "Checking Frontend..."

if [ -d "$PROJECT/src" ]; then

    echo "✅ Frontend available"

else

    echo "❌ Frontend missing"

fi



echo ""


echo "Checking Spacemonkey..."

if [ -d "$PROJECT/server/services/aiBrainV2/system/spacemonkey" ]; then

    echo "✅ Spacemonkey available"

else

    echo "❌ Spacemonkey missing"

fi



echo ""

echo "================================"

echo "🛰️ Runtime check complete"
