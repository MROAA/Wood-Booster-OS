#!/bin/bash


SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

VERSION=$(cat "$SCRIPT_DIR/VERSION")



echo "🛰️ Wood-Booster OS Bootstrap v$VERSION"

echo ""



echo "[1/6] Installing system packages"

bash "$SCRIPT_DIR/install/packages.sh"



echo ""

echo "[2/6] Installing project"

bash "$SCRIPT_DIR/install/project.sh"



echo ""

echo "[3/6] Setting up backend"

bash "$SCRIPT_DIR/setup/backend.sh"



echo ""

echo "[4/6] Setting up frontend"

bash "$SCRIPT_DIR/setup/frontend.sh"



echo ""

echo "[5/6] Setting up Spacemonkey"

bash "$SCRIPT_DIR/setup/spacemonkey.sh"



echo ""

echo "[6/6] Running health check"

bash "$SCRIPT_DIR/verify/healthcheck.sh"



echo ""

echo "================================"
echo "✅ Wood-Booster OS READY"
echo "================================"

echo ""

echo "🛰️ System:"
echo "Wood-Booster OS"

echo ""

echo "🛰️ AI:"
echo "Spacemonkey available"

echo ""

echo "Next:"
echo "Start Wood-Booster OS"
