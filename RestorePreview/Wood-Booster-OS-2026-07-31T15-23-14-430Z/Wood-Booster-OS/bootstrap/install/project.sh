#!/bin/bash

echo "🛰️ Installing Wood-Booster OS"

PROJECT_DIR="$HOME/Wood-Booster-AI"

if [ -d "$PROJECT_DIR" ]; then

    echo "Project folder already exists"

else

    mkdir -p "$PROJECT_DIR"

fi


cd "$PROJECT_DIR"


if [ -d "Wood-Booster-OS" ]; then

    echo "Wood-Booster OS already exists"

else

    git clone YOUR_GITHUB_REPOSITORY_URL Wood-Booster-OS

fi


echo "Project ready"
