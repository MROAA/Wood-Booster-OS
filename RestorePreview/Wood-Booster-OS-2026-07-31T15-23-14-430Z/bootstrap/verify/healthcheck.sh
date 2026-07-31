#!/bin/bash

echo ""
echo "🛰️ Wood-Booster OS Health Check"
echo "================================"

echo ""

echo "Checking Node..."

if command -v node >/dev/null 2>&1; then
    echo "✅ Node:"
    node --version
else
    echo "❌ Node missing"
fi


echo ""

echo "Checking npm..."

if command -v npm >/dev/null 2>&1; then
    echo "✅ npm:"
    npm --version
else
    echo "❌ npm missing"
fi


echo ""

echo "Checking Python..."

if command -v python >/dev/null 2>&1; then
    echo "✅ Python:"
    python --version
else
    echo "❌ Python missing"
fi


echo ""

echo "Checking Docker..."

if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker:"
    docker --version
else
    echo "❌ Docker missing"
fi


echo ""

PROJECT="$HOME/Wood-Booster-AI/Wood-Booster-OS"


echo "Checking project..."

if [ -d "$PROJECT" ]; then
    echo "✅ Wood-Booster OS found"
else
    echo "❌ Project missing"
fi


echo ""

echo "Checking frontend build..."

if [ -d "$PROJECT/dist" ]; then
    echo "✅ Frontend build exists"
else
    echo "❌ Frontend build missing"
fi


echo ""

echo "================================"
echo "🛰️ Health check completed"
echo "================================"
