
/**
 * Hearthwood Dev Studio
 * Spacemonkey Tool Router V2
 *
 * Tunnistaa käyttäjän tarkoituksen ja valitsee
 * siihen sopivan rekisteröidyn työkalun.
 *
 * Tämä moduuli vain valitsee työkalun.
 * Se ei suorita komentoja eikä muuta tiedostoja.
 */

import {
  getHearthwoodSkill,
} from "./hearthwoodSkillRegistry.js"

const MIN_SCORE = 5

const AUTO_RUNNABLE = new Set([
  "code-analysis",
  "change-planning",
  "image-studio",
])

// Usean tunnusmerkin pisteytys vähentää sitä,
// että yksittäinen sana valitsisi väärän työkalun.

const ROUTES = [
  {
    skillId: "asset-manager",
    reason: "Pelin resurssien hallinta",
    rules: [
      [
        /käyttämättöm|asset.?inventaar|resurssitiedosto|puuttuv.*(?:kuv|ään)|etsi.*käyttämättöm/i,
        10,
      ],
      [
        /asset.?manager|resurssien inventaar|tiedostojen inventaar/i,
        8,
      ],
    ],
  },

  {
    skillId: "audio-studio",
    reason: "Äänenkäsittely tai äänisuunnittelu",
    rules: [
      [
        /ään|musiik|audio|sound|sfx|wav|mp3|ogg|miksa|kohina|kaiku|ffmpeg/i,
        8,
      ],
      [
        /normalisoi|äänenvoimakkuus|äänitehost|ääniraita/i,
        4,
      ],
    ],
  },

  {
    skillId: "image-studio",
    reason: "Kuvankäsittely tai peligrafiikka",
    rules: [
      [
        /kuv|grafiik|avatar|sprite|png|jpe?g|webp|piksel|läpinäky/i,
        4,
      ],
      [
        /pienenn|suurenn|skaala|pienemmäksi|suuremmaksi|isommaksi|muunna|kuvakoko/i,
        5,
      ],
      [
        /(?:muuta|muokkaa|tee|luo)\b[^\n]{0,100}(?:kuv|png|sprite|avatar)/i,
        5,
      ],
      [
        /\b\d{1,4}\s*[x×]\s*\d{1,4}\b/i,
        4,
      ],
    ],
  },

  {
    skillId: "qa-testing",
    reason: "Pelin laadunvarmistus",
    rules: [
      [
        /suorita test|testaa|regressio|build.?test|pelin testaus|kaatumisraport|testikattavuus/i,
        10,
      ],
      [
        /laadunvarmistus|qa.?test/i,
        8,
      ],
    ],
  },

  {
    skillId: "project-manager",
    reason: "Projektin suunnittelu ja priorisointi",
    rules: [
      [
        /sprint|prioris|roadmap|kehityslista|kehitysjono|mitä.{0,40}seuraavaksi|projektin etenemi/i,
        10,
      ],
      [
        /backlog|projektipäällikk|aikataul|kehityssuunnitelma/i,
        8,
      ],
    ],
  },

  {
    skillId: "lore-keeper",
    reason: "Hearthwoodin tarina ja maailma",
    rules: [
      [
        /lore|tarina|mytologi|kalevala|maailmanrakenn|taustatarin/i,
        9,
      ],
      [
        /juoni|hahmon historia|pelin maailma/i,
        6,
      ],
    ],
  },

  {
    skillId: "project-awareness",
    reason: "Projektin rakenteen tutkiminen",
    rules: [
      [
        /projektin rakenne|listaa tiedost|etsi tiedosto|löydä tiedosto|tiedostorakenne/i,
        10,
      ],
      [
        /missä tiedostossa|projektin kansiot|hakemistorakenne/i,
        8,
      ],
    ],
  },

  {
    skillId: "code-analysis",
    reason: "Lähdekoodin ja pelijärjestelmien tutkiminen",
    rules: [
      [
        /selvitä|tutki|analysoi|selitä|tarkista|kerro|kuinka|miten|miksi/i,
        3,
      ],
      [
        /toimi|toiminta|miksi|virhe|bugi|ei näy|ei toimi/i,
        4,
      ],
      [
        /mana|resurssi|taistelu|kyky|skill|luokka|vuoro|vahink|hahmo|tekoäly|algoritm|järjestelm|mekaniik|tiedost|moduul/i,
        2,
      ],
      [
        /miten.{0,120}toimi|miksi.{0,120}(?:toimi|näy|tapahdu)|selvitä.{0,120}toim/i,
        5,
      ],
      [
        /lähdekood|koodi|funktio|riippuvuu|\.jsx?\b|\.tsx?\b/i,
        5,
      ],
    ],
  },

  {
    skillId: "game-design",
    reason: "Pelimekaniikkojen suunnittelu",
    rules: [
      [
        /tasapaino|tasapainota|balans|vaikeustaso|taistelumekanii|pelimekanii|hahmoluokk|skillien tasapaino/i,
        10,
      ],
      [
        /pelisuunnittel|pelin säännöt|synergian suunnittel/i,
        8,
      ],
    ],
  },

  {
    skillId: "change-planning",
    reason: "Kehitysmuutoksen suunnittelu",
    rules: [
      [
        /suunnittele|toteuta|kehitä|rakenna|muuta|korjaa|lisää|uudista|refaktoroi|paranna|päivitä|vaihda/i,
        7,
      ],
      [
        /korjaa.{0,100}(?:bugi|virhe|ongelma)|korjaa.{0,100}ei toimi/i,
        5,
      ],
      [
        /uusi ominaisuus|muutossuunnitelma|tee muutos/i,
        7,
      ],
    ],
  },
]

/**
 * Valitsee korkeimman pistemäärän saaneen
 * rekisteröidyn työkalun.
 *
 * Tulos kertoo myös, onko rajattu
 * automaattinen suoritus sallittu.
 */

export function routeHearthwoodRequest(prompt) {
  if (
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    return {
      success: false,
      matched: false,
      reason: "Pyyntö puuttuu.",
      canExecuteAutomatically: false,
    }
  }

  const request = prompt.trim()

  let bestMatch = null

  for (const route of ROUTES) {
    const score = route.rules.reduce(
      (sum, [pattern, points]) =>
        sum + (pattern.test(request) ? points : 0),
      0,
    )

    if (
      score < MIN_SCORE ||
      (bestMatch && score <= bestMatch.score)
    ) {
      continue
    }

    const skill = getHearthwoodSkill(
      route.skillId,
    )

    if (!skill) {
      continue
    }

    bestMatch = {
      route,
      skill,
      score,
    }
  }

  if (!bestMatch) {
    return {
      success: true,
      matched: false,
      request,
      skill: null,
      endpoint: null,
      apiReady: false,
      requiresApproval: false,
      canExecuteAutomatically: false,
      message:
        "Spacemonkey ei vielä tunnistanut pyynnölle sopivaa taitoa.",
    }
  }

  const {
    route,
    skill,
  } = bestMatch

  const apiReady =
    Boolean(skill.endpoint) &&
    (
      skill.status === "available" ||
      skill.status === "api-ready"
    )

  const requiresApproval =
    Boolean(skill.requiresApproval)

  const canExecuteAutomatically =
    apiReady &&
    !requiresApproval &&
    AUTO_RUNNABLE.has(skill.id)

  const message =
    skill.status === "planned"
      ? (
          `Taito ${skill.name} on suunnitteilla, ` +
          "eikä sitä voi vielä suorittaa."
        )
      : canExecuteAutomatically
        ? (
            `Spacemonkey valitsi taidon ${skill.name}. ` +
            "Rajattu työkalupyyntö voidaan suorittaa automaattisesti."
          )
        : (
            `Spacemonkey valitsi taidon ${skill.name}, ` +
            "mutta sitä ei voi suorittaa automaattisesti."
          )

  return {
    success: true,
    matched: true,
    request,

    skill: {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      status: skill.status,
    },

    endpoint: skill.endpoint || null,
    reason: route.reason,
    apiReady,
    requiresApproval,
    canExecuteAutomatically,
    message,
  }
}

/**
 * Palauttaa kaikkien tunnettujen
 * reitityssääntöjen perustiedot.
 */

export function listHearthwoodRoutes() {
  return ROUTES.map(route => ({
    skillId: route.skillId,
    reason: route.reason,
  }))
}
