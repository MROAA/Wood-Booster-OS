#!/bin/bash

echo "🛰️ Setting up Wood-Booster frontend"


PROJECT="$HOME/Wood-Booster-AI/Wood-Booster-OS"


if [ ! -d "$PROJECT" ]; then

    echo "Frontend project not found"

    exit 1

fi


cd "$PROJECT"


echo "Installing frontend packages..."


npm install


echo ""

echo "Building frontend..."


npm run build


echo ""

echo "Frontend setup completed"
