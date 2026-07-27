#!/bin/bash


SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"



echo ""
echo "🛰️ Wood-Booster OS Runtime"
echo "================================"

echo ""



echo "Checking runtime..."

echo ""



bash "$SCRIPT_DIR/runtime/status.sh"



echo ""

echo "================================"

echo "Starting services..."

echo "================================"


echo ""



echo "🛰️ Starting Spacemonkey"

bash "$SCRIPT_DIR/runtime/spacemonkey-start.sh"



echo ""

echo "🛰️ Starting backend"

bash "$SCRIPT_DIR/runtime/backend-start.sh" &


sleep 3


echo ""

echo "🛰️ Starting frontend"

bash "$SCRIPT_DIR/runtime/frontend-start.sh"


