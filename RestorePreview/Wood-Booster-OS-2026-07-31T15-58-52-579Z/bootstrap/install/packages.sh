#!/bin/bash

echo "🛰️ Installing system packages"


sudo pacman -S --needed \
git \
nodejs \
npm \
python \
docker \
curl


echo ""

echo "System packages ready"
