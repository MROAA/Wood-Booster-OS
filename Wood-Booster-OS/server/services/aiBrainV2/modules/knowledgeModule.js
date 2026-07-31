/*
=====================================
WOOD-BOOSTER AI BRAIN V2
KNOWLEDGE MODULE
Vastuut:
- tunnistaa tietopankkiin liittyvät kysymykset
- hakee tiedostopohjaista tietoa
- välittää tiedon nykyiselle AI Brainille
- antaa nykyisen AI Brainin hakea lisäksi
  tietokantatiedon Prismalla
- palauttaa yhtenäisen AI Brain v2 -tuloksen
Tämä tiedosto ei:
- muuta nykyistä AI Brainia
- kirjoita tietopankkiin
- muuta tietokannan sisältöä
- toteuta omaa kielimallia
=====================================
*/
import {
  runAIBrain,
} from "../../aiBrain.js"
import {
  searchKnowledge,
} from "../../knowledgeSearch.js"
import {
  createBrainModule,
} from "../moduleContract.js"
