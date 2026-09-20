"""Yhteiset polkuratkaisut Python-taustaohjelman moduuleille.

Erottaa tarkoituksella toisistaan neljä asiaa jotka sattuvat olemaan
sama hakemisto kehitystilassa, mutta eivät ole sama asennetussa
sovelluksessa (kun backend/ ja src/ ajetaan Tauri-sidecarin resurssi-
kimpusta, ei elävästä git-repositorystä):

- SOURCE_ROOT: mistä backend/ ja src/spacemonkey/ oikeasti löytyvät -
  aina __file__-suhteellinen, koska ne paketoidaan aina toistensa
  vierelle, riippumatta mihin asennettu sovellus lopulta asentuu.
- GIT_ROOT: mitä git-repositoryä vasten Git Guardian tekee oikeita
  git-komentoja - kehitystilassa sama kuin SOURCE_ROOT, mutta
  asennetussa sovelluksessa Marcin oikea, elävä checkout, ei koskaan
  read-only-tyyppinen resurssikimppu.
- VAULT_ROOT: minkä kansion sisällä tiedostonhallinta ja oikea pääte
  aloittavat (Wood-Booster-AI-projektikansio, joka on GIT_ROOTia yksi
  taso ylempänä).
- PY_DATA_DIR: minne pysyvä ajonaikainen data (historia, asetukset,
  ladatut tiedostot) kirjoitetaan - kehitystilassa backend/data/, mutta
  asennetussa sovelluksessa Tauri app_data_dir, jotta data säilyy myös
  sovelluspäivitysten yli eikä sotke resurssikimppua.
"""

import os

_MODULES_DIR = os.path.dirname(__file__)

SOURCE_ROOT = os.path.abspath(
    os.path.join(_MODULES_DIR, "..", "..")
)

GIT_ROOT = os.environ.get("WOOD_BOOSTER_GIT_ROOT") or SOURCE_ROOT

VAULT_ROOT = os.environ.get("WOOD_BOOSTER_VAULT_ROOT") or os.path.abspath(
    os.path.join(_MODULES_DIR, "..", "..", "..")
)

PY_DATA_DIR = os.environ.get("WOOD_BOOSTER_PY_DATA_DIR") or os.path.abspath(
    os.path.join(_MODULES_DIR, "..", "data")
)
