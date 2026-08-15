#!/bin/bash
echo "Käynnistetään Wood-Booster HQ (v2.0)..."

# Käynnistetään Node-backend taustalle
echo "Käynnistetään Backend (Node.js)..."
node server/index.js &
NODE_PID=$!

# Käynnistetään Python-backend (portti 8002) taustalle - Spacemonkey-chat,
# Altrako, työpöydän pääte ja tiedostonhallinta puhuvat tähän suoraan.
if [ -x "venv/bin/python3" ]; then
  echo "Käynnistetään Backend (Python, portti 8002)..."
  venv/bin/python3 -m backend.main &
  PYTHON_PID=$!
else
  echo "HUOM: venv/ puuttuu, Python-backend (portti 8002) ei käynnisty."
  echo "Aja ensin: python3 -m venv venv && venv/bin/pip install -r backend/requirements.txt"
  PYTHON_PID=""
fi

# Ilmoitetaan käyttäjälle
echo "Wood-Booster HQ Backend (Node) on nyt käynnissä (PID: $NODE_PID)."
if [ -n "$PYTHON_PID" ]; then
  echo "Wood-Booster HQ Backend (Python) on nyt käynnissä (PID: $PYTHON_PID)."
fi
echo "Voit nyt käynnistää frontendin komentolla: npm run dev"

# Odotetaan molempia taustaprosesseja
wait
