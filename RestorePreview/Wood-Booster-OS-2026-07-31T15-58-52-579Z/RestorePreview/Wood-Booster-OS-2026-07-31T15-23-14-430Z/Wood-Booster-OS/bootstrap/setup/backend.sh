#!/bin/bash

echo "🛰️ Setting up Wood-Booster backend"


PROJECT="$HOME/Wood-Booster-AI/Wood-Booster-OS/server"


if [ ! -d "$PROJECT" ]; then

    echo "Backend folder not found"

    exit 1

fi


cd "$PROJECT"


echo "Installing backend packages..."


npm install


echo "Generating Prisma client..."


npx prisma generate


echo ""

echo "Backend setup completed"
