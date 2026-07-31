#!/bin/bash


echo ""
echo "🛰️ Stopping Wood-Booster OS"
echo "================================"

echo ""


echo "Stopping frontend..."

pkill -f "vite" || true


echo "Stopping backend..."

pkill -f "node" || true


echo ""

echo "Stopping Spacemonkey runtime..."

pkill -f "spacemonkey" || true


echo ""

echo "================================"
echo "✅ Wood-Booster OS stopped"
echo "================================"
