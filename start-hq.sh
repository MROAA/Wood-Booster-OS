#!/bin/bash
echo "Käynnistetään Wood-Booster HQ (v2.0)..."

# Käynnistetään backend taustalle
echo "Käynnistetään Backend (Node.js)..."
node server/index.js &
BACKEND_PID=$!

# Ilmoitetaan käyttäjälle
echo "Wood-Booster HQ Backend on nyt käynnissä (PID: $BACKEND_PID)."
echo "Voit nyt käynnistää frontendin komentolla: npm run dev"

# Odotetaan taustaprosessia
wait $BACKEND_PID
