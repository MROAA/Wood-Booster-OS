# Tuotegalleria (Product Gallery)

Boosterverse-plugin: selaa Wood-Boosterin tuotteita (esim. River Tables) yhdessä
näkymässä, kuvineen ja tiedoineen. Lukee tiedot suoraan `02-Products`-kansion
tuoteprojekteista — ei omaa tietokantaa.

Core (`backend/`, `server/`) ei muutu tästä pluginista mihinkään suuntaan.

## Käynnistys

```bash
cd boosterverse/product-gallery
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run streamlit_app.py
```

Avautuu osoitteeseen http://localhost:8501.

## Tuotteiden lisääminen

Jokainen tuote on oma kansio `02-Products/<Kategoria>/<Tuote>/` (ks.
`14-Templates/Product-Project` pohjana). Galleria lukee näistä:

- `overview.md` — nimi, idea, mitat, puulaji, hinta-arvio, projektin tila
- `materials.md`, `costs.md`, `design.md`, `work-steps.md`, `lessons-learned.md`,
  `marketing.md` — näytetään tuotteen alasivulla omina osioinaan
- `images/*.jpg|png|webp` — tuotteen valokuvat; ensimmäinen näytetään
  kansikuvana galleriassa

Tyhjät kentät eivät riko mitään — tuote näkyy silti, kevyempänä korttina.

## Tuotekansion sijainti

Wood-Booster-OS ja Wood-Booster-AI (jossa `02-Products` sijaitsee) ovat kaksi
eri git-repoa samalla koneella. Galleria olettaa oletuksena, että ne ovat
sisarkansioita:

```
Wood-Booster-AI/
├── 02-Products/
└── Wood-Booster-OS/
    └── boosterverse/product-gallery/   ← tämä sovellus
```

Jos tuotekansio on muualla, aseta ympäristömuuttuja ennen käynnistystä:

```bash
export WOOD_BOOSTER_PRODUCTS_DIR=/polku/02-Products
```
