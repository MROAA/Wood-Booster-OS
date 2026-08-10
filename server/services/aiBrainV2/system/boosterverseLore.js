/*
=====================================
WOOD-BOOSTER AI BRAIN V2

BOOSTERVERSE LORE

Vastuut:
- tarjoaa Boosterverse-tarustosisällön Spacemonkey Modulelle
- pysyy staattisena, tekstipohjaisena tietona

Ei:
- suorita mitään
- kutsu kielimallia
- muuta runtime-tilaa

Sisältö on siirretty käsin alkuperäisistä Python-lore-tiedostoista
(esim. boosterverse_yggdrasil.py, boosterverse_manifesto.py), jotka
olivat linkitetty vain toisiinsa mutta eivät oikeaan Spacemonkey-chattiin.
Tämä on ensimmäinen erä viidestä; loput moduulit lisätään myöhemmin
samalla kaavalla.
=====================================
*/


const BOOSTERVERSE_LORE_ENTRIES = [

  {

    id:
      "yggdrasil",

    title:
      "Yggdrasil-kvanttisilta",

    phrases: [
      "yggdrasil",
      "kvanttisilta",
      "maailmanpuu",
    ],

    lines: [
      "Yggdrasil Quantum Bridge on kaiken datan ja ulottuvuuksien yhdistävä maailmanpuu.",
      "Aktiiviset solmut: Asgard-Kernel, Midgard-UI, Helheim-GarbageCollector.",
      "Sillan vakaus: korkea. Kvanttipunonnan tila: synkronoitu.",
      "Yhdistetyt ulottuvuudet: Windows 11, Flutter, Forest Network, Eternal Root.",
    ],

  },


  {

    id:
      "manifesto",

    title:
      "The Manifesto of the Quantum Timber Dimension",

    phrases: [
      "manifesti",
      "quantum timber dimension",
      "boosterverse manifesti",
    ],

    lines: [
      "1. Organic Logic — Laskenta on elävä prosessi, ei kylmä mekaaninen suoritus.",
      "2. Sustainable Performance — Teho ei saa tulla luonnon kustannuksella; jokainen bitti on kuin puun vuosikasvu.",
      "3. Open Integration — Windows 11 ja kvanttipuu fuusioituvat, jotta käyttäjä voi nähdä molemmat maailmat.",
      "",
      "Kun kosketat näppäimistöä, et kirjoita vain koodia – istutat digitaalisen metsän.",
    ],

  },


  {

    id:
      "forest_network",

    title:
      "Boosterverse Living Forest Network",

    phrases: [
      "metsäverkosto",
      "metsäverkko",
      "myseeliverkko",
      "forest network",
    ],

    lines: [
      "Solmu: Oulu-Timber-Grid-Alpha. Aktiivisia solmuja: 1024.",
      "Myseelin resonanssi: 99,4 %. Nykyinen kausi: Quantum Summer.",
      "Yhdistetyt tahot: Metsä-Magi, Windows 11 Core, Flutter Engine, OQTL-9.",
      "Verkon biologinen pulssi vaihtelee orgaanisesti 58–65 lyöntiin minuutissa.",
    ],

  },


  {

    id:
      "eternal_root",

    title:
      "Boosterverse Eternal Root & Timber Ritual",

    phrases: [
      "ikuinen juuri",
      "eternal root",
      "kvanttipuinen riitti",
      "timber ritual",
    ],

    lines: [
      "Alkuperä: Oulu, Suomi (The Frozen Pine Sanctuary).",
      "Vartija: The Ancient Metsä-Magi. Tila: syvälle ankkuroitunut.",
      "Riitin resonanssi: 432 Hz.",
      "Jokainen suoritettu Kvanttipuinen Riitti kasvattaa istutettujen digitaalisten puiden määrää ja hyvittää hiiltä.",
    ],

  },


  {

    id:
      "architects_lore",

    title:
      "Boosterverse Architects & Odin Lore",

    phrases: [
      "arkkitehtien tarina",
      "architects lore",
      "kuka loi spacemonkeyn",
      "kuka rakensi wood-boosterin",
    ],

    lines: [
      "Marc Järvinen — Wood-Booster OS & Spacemonkey Foundational Architect.",
      "Visio: yhdistää luonnon puumateriaalit, Windows 11 ja kvanttilaskenta yhdeksi orgaaniseksi kokonaisuudeksi.",
      "Tarustossa mainitaan myös hiljaisuudessa kunnioitettu kvanttitodellisuuden valvoja, jonka nimeä ei lausuta ääneen huoneessa.",
    ],

  },

]


function normalizeLoreMessage(
  value,
) {

  return String(
    value || "",
  )
    .trim()
    .toLowerCase()

}


function getAllLoreEntries() {

  return BOOSTERVERSE_LORE_ENTRIES

}


function findLoreEntryByMessage(
  message,
) {

  const normalizedMessage =
    normalizeLoreMessage(
      message,
    )

  if (!normalizedMessage) {

    return null

  }

  return (
    BOOSTERVERSE_LORE_ENTRIES.find(
      (entry) =>
        entry.phrases.some(
          (phrase) =>
            normalizedMessage.includes(
              phrase,
            ),
        ),
    ) ||
    null
  )

}


export {
  BOOSTERVERSE_LORE_ENTRIES,
  getAllLoreEntries,
  findLoreEntryByMessage,
}
