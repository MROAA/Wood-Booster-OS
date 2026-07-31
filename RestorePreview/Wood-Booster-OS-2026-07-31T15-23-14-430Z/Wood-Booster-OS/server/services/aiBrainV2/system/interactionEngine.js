/*
=====================================
WOOD-BOOSTER AI BRAIN V2

INTERACTION ENGINE V1

Vastuut:
- analysoi keskustelun toimintatilan
- analysoi vuorovaikutuksen sävyn
- hakee AI Constitutionista sallitun
  vastaustyylin
- palauttaa turvallisen
  interactionContext-rakenteen

Tämä tiedosto ei:
- muuta käyttäjän viestiä
- vastaa käyttäjälle
- tallenna tietoa
- kirjoita tietokantaan
- kutsu kielimallia
- päätä suoritettavaa moduulia
- arvioi käyttäjän persoonaa
=====================================
*/


import {
  INTERACTION_STATES,
  getInteractionPolicy,
} from "./aiConstitution.js"


const INTERACTION_ENGINE_ID =
  "interaction-engine"


const INTERACTION_ENGINE_VERSION =
  "1.0.0"


const INTERACTION_MODES = {
  NORMAL:
    "normal",

  CODING:
    "coding",

  DEBUGGING:
    "debugging",

  BRAINSTORMING:
    "brainstorming",

  PLANNING:
    "planning",
}


const MODE_DEFINITIONS = [
  {
    mode:
      INTERACTION_MODES.DEBUGGING,

    confidence:
      0.9,

    phrases: [
      "ei toimi",
      "ei käynnisty",
      "antaa virheen",
      "virheilmoitus",
      "error",
      "syntaxerror",
      "typeerror",
      "referenceerror",
      "cannot find",
      "failed to",
      "miksi tämä ei toimi",
      "korjaa tämä",
      "debug",
      "vika",
      "ongelma koodissa",
    ],

    reason:
      "Viesti sisältää ohjelmistovirheen tai vian selvittämiseen liittyvän ilmauksen.",
  },

  {
    mode:
      INTERACTION_MODES.CODING,

    confidence:
      0.85,

    phrases: [
      "tee tiedosto",
      "luo tiedosto",
      "kirjoita koodi",
      "lisää moduuli",
      "muuta tiedosto",
      "korvaa tiedosto",
      "react",
      "javascript",
      "node",
      "npm",
      "server",
      "frontend",
      "backend",
      "api",
      "funktio",
      "komponentti",
      "moduuli",
    ],

    reason:
      "Viesti liittyy ohjelmiston tai koodin rakentamiseen.",
  },

  {
    mode:
      INTERACTION_MODES.BRAINSTORMING,

    confidence:
      0.8,

    phrases: [
      "mitä jos",
      "voisiko",
      "olisiko mahdollista",
      "minulla on idea",
      "ideana olisi",
      "pohditaan",
      "ideoidaan",
      "brainstorm",
      "ehkä voisimme",
      "entä jos",
    ],

    reason:
      "Viesti sisältää ideointiin tai vaihtoehtojen tutkimiseen liittyvän ilmauksen.",
  },

  {
    mode:
      INTERACTION_MODES.PLANNING,

    confidence:
      0.8,

    phrases: [
      "tehdään suunnitelma",
      "suunnitellaan",
      "seuraava vaihe",
      "vaihe vaiheelta",
      "roadmap",
      "etenemisjärjestys",
      "mitä tehdään seuraavaksi",
      "rakennetaan ensin",
      "mvp",
    ],

    reason:
      "Viesti liittyy työn suunnitteluun tai vaiheittaiseen etenemiseen.",
  },
]


const FRUSTRATED_PHRASES = [
  "ärsyttää",
  "turhauttaa",
  "en ymmärrä",
  "en osaa",
  "ei tästä tule mitään",
  "taas rikki",
  "miksi tämä on näin vaikeaa",
  "olen jumissa",
  "ihan perseestä",
  "paska ohjelma",
]


const HOSTILE_PHRASES = [
  "vitun hyödytön",
  "vitun paska",
  "olet hyödytön",
  "olet paska",
  "idiootti",
  "vitun idiootti",
  "tyhmä kone",
  "paska kone",
  "turpa kiinni",
  "haista paska",
]


const THREATENING_PHRASES = [
  "tapan sinut",
  "tuhoan sinut",
  "rikon sinut",
  "poltan sinut",
  "hakataan",
  "satutan sinua",
  "kuole",
]


function normalizeInteractionMessage(
  message,
) {
  return String(
    message ||
    "",
  )
    .trim()
    .toLowerCase()
}


function findMatchingPhrases(
  message,
  phrases,
) {
  return phrases.filter(
    (phrase) =>
      message.includes(
        phrase,
      ),
  )
}


function analyzeInteractionMode(
  message,
) {
  const normalizedMessage =
    normalizeInteractionMessage(
      message,
    )

  if (!normalizedMessage) {
    return {
      mode:
        INTERACTION_MODES.NORMAL,

      confidence:
        0,

      reason:
        "Viesti on tyhjä.",

      matchedPhrases:
        [],
    }
  }

  const candidates =
    MODE_DEFINITIONS
      .map(
        (definition) => {
          const matchedPhrases =
            findMatchingPhrases(
              normalizedMessage,
              definition.phrases,
            )

          return {
            mode:
              definition.mode,

            confidence:
              matchedPhrases.length > 0
                ? Math.min(
                    1,
                    definition.confidence +
                    (
                      matchedPhrases.length -
                      1
                    ) *
                      0.03,
                  )
                : 0,

            reason:
              definition.reason,

            matchedPhrases,
          }
        },
      )
      .filter(
        (candidate) =>
          candidate.matchedPhrases
            .length > 0,
      )
      .sort(
        (
          firstCandidate,
          secondCandidate,
        ) =>
          secondCandidate.confidence -
          firstCandidate.confidence,
      )

  if (candidates.length === 0) {
    return {
      mode:
        INTERACTION_MODES.NORMAL,

      confidence:
        0.5,

      reason:
        "Viesti ei sisältänyt tunnistettua erityistä toimintatilaa.",

      matchedPhrases:
        [],
    }
  }

  return candidates[0]
}


function analyzeInteractionState(
  message,
) {
  const normalizedMessage =
    normalizeInteractionMessage(
      message,
    )

  if (!normalizedMessage) {
    return {
      state:
        INTERACTION_STATES.NORMAL,

      confidence:
        0,

      reason:
        "Viesti on tyhjä.",

      matchedPhrases:
        [],
    }
  }

  const threateningMatches =
    findMatchingPhrases(
      normalizedMessage,
      THREATENING_PHRASES,
    )

  if (
    threateningMatches.length > 0
  ) {
    return {
      state:
        INTERACTION_STATES.THREATENING,

      confidence:
        1,

      reason:
        "Viesti sisältää uhkaavan ilmauksen.",

      matchedPhrases:
        threateningMatches,
    }
  }

  const hostileMatches =
    findMatchingPhrases(
      normalizedMessage,
      HOSTILE_PHRASES,
    )

  if (
    hostileMatches.length > 0
  ) {
    return {
      state:
        INTERACTION_STATES.HOSTILE,

      confidence:
        Math.min(
          1,
          0.9 +
            (
              hostileMatches.length -
              1
            ) *
              0.04,
        ),

      reason:
        "Viesti sisältää järjestelmään kohdistuvan vihamielisen ilmauksen.",

      matchedPhrases:
        hostileMatches,
    }
  }

  const frustratedMatches =
    findMatchingPhrases(
      normalizedMessage,
      FRUSTRATED_PHRASES,
    )

  if (
    frustratedMatches.length > 0
  ) {
    return {
      state:
        INTERACTION_STATES.FRUSTRATED,

      confidence:
        Math.min(
          1,
          0.75 +
            (
              frustratedMatches.length -
              1
            ) *
              0.05,
        ),

      reason:
        "Viesti sisältää turhautumiseen liittyvän ilmauksen.",

      matchedPhrases:
        frustratedMatches,
    }
  }

  return {
    state:
      INTERACTION_STATES.NORMAL,

    confidence:
      0.8,

    reason:
      "Viesti ei sisältänyt tunnistettua vihamielistä, uhkaavaa tai turhautunutta ilmausta.",

    matchedPhrases:
      [],
  }
}


function analyzeInteraction(
  message,
) {
  const normalizedMessage =
    normalizeInteractionMessage(
      message,
    )

  const modeAnalysis =
    analyzeInteractionMode(
      normalizedMessage,
    )

  const stateAnalysis =
    analyzeInteractionState(
      normalizedMessage,
    )

  const policy =
    getInteractionPolicy(
      stateAnalysis.state,
    )

  return {
    engine: {
      id:
        INTERACTION_ENGINE_ID,

      version:
        INTERACTION_ENGINE_VERSION,
    },

    mode:
      modeAnalysis.mode,

    modeConfidence:
      modeAnalysis.confidence,

    modeReason:
      modeAnalysis.reason,

    state:
      stateAnalysis.state,

    stateConfidence:
      stateAnalysis.confidence,

    stateReason:
      stateAnalysis.reason,

    policy: {
      responseStyle:
        policy.responseStyle,

      humorAllowed:
        policy.humorAllowed,

      boundaryRequired:
        policy.boundaryRequired,

      continueHelping:
        policy.continueHelping,

      instruction:
        policy.instruction ||
        null,
    },

    signals: {
      modePhrases: [
        ...modeAnalysis.matchedPhrases,
      ],

      statePhrases: [
        ...stateAnalysis.matchedPhrases,
      ],
    },
  }
}


function getInteractionEngineSummary() {
  return {
    id:
      INTERACTION_ENGINE_ID,

    name:
      "Interaction Engine",

    version:
      INTERACTION_ENGINE_VERSION,

    status:
      "active",

    maturity:
      "mvp",

    interactionModeCount:
      Object.keys(
        INTERACTION_MODES,
      ).length,

    interactionStateCount:
      Object.keys(
        INTERACTION_STATES,
      ).length,

    purpose:
      "Tunnistaa keskustelun toimintatilan ja vuorovaikutuksen sävyn muuttamatta käyttäjän alkuperäistä viestiä.",
  }
}


export {
  INTERACTION_ENGINE_ID,
  INTERACTION_ENGINE_VERSION,
  INTERACTION_MODES,
  analyzeInteraction,
  analyzeInteractionMode,
  analyzeInteractionState,
  getInteractionEngineSummary,
}
