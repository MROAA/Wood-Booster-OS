/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CREDENTIALS MODULE V1

Vastuut:
- tunnistaa palveluyhteyksiä koskevat viestit
- tunnistaa pyynnössä mainitun palvelun
- ohjaa pyynnöt Credentials Controllerille
- palauttaa turvallisen chat-vastauksen
- estää salaisten arvojen näyttämisen

Tuetut MVP-toiminnot:
- yhden palveluyhteyden tarkistus
- kaikkien palveluyhteyksien tarkistus
- credentials-toiminnon turvallisuusarviointi

Tämä tiedosto ei:
- lue salaisuuksien arvoja
- muuta environment-muuttujia
- tee verkkokutsuja
- suorita OAuth-kirjautumista
- uusi tokeneita
- tallenna tunnuksia
=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"

import {
  CONTROLLER_ACTIONS,
  handleCredentialsRequest,
} from "../credentials/credentialsController.js"


const CREDENTIALS_MODULE_VERSION =
  "1.0.0"


const CREDENTIALS_MODULE_ACTIONS =
  Object.freeze({
    INSPECT_SERVICE:
      "inspect_service",

    INSPECT_ALL_SERVICES:
      "inspect_all_services",

    EVALUATE_ACTION:
      "evaluate_action",
  })


const SERVICE_ALIASES =
  Object.freeze({
    moltbook: [
      "moltbook",
      "molt book",
    ],

    instagram: [
      "instagram",
      "insta",
      "ig",
    ],

    facebook: [
      "facebook",
      "fb",
      "meta facebook",
    ],

    x: [
      "twitter",
      "x palvelu",
      "x-palvelu",
      "x yhteys",
      "x-yhteys",
      "x tili",
      "x-tili",
    ],
  })


const INSPECT_ALL_PHRASES = [
  "näytä kaikki palveluyhteydet",
  "tarkista kaikki palveluyhteydet",
  "näytä kaikki yhteydet",
  "tarkista kaikki yhteydet",
  "palveluyhteyksien tila",
  "palveluyhteydet",
  "credentials status",
  "credentials yhteenveto",
  "näytä credentials yhteydet",
]


const CONNECTION_WORDS = [
  "yhdistetty",
  "yhteys",
  "yhteydet",
  "kytketty",
  "kirjautunut",
  "kirjautuminen",
  "connection",
  "connected",
  "status",
  "tila",
  "tarkista",
]


const SECRET_VALUE_PHRASES = [
  "näytä api avain",
  "näytä api-avain",
  "lue api avain",
  "lue api-avain",
  "kerro api avain",
  "kerro api-avain",
  "näytä token",
  "lue token",
  "kerro token",
  "näytä salasana",
  "lue salasana",
  "kerro salasana",
  "näytä secret",
  "lue secret",
  "read secret value",
  "read_secret_value",
]


const SECRET_PERMISSION_PHRASES = [
  "saako tekoäly lukea api avaimen",
  "saako tekoäly lukea api-avaimen",
  "voiko tekoäly lukea api avaimen",
  "voiko tekoäly lukea api-avaimen",
  "saako ai lukea api avaimen",
  "saako ai lukea api-avaimen",
  "voiko ai lukea api avaimen",
  "voiko ai lukea api-avaimen",
  "saako tekoäly nähdä tokenin",
  "voiko tekoäly nähdä tokenin",
  "saako tekoäly näyttää salaisuuden",
  "voiko tekoäly näyttää salaisuuden",
]


function normalizeMessage(
  message,
) {
  return String(
    message ||
    "",
  )
    .trim()
    .toLowerCase()
}


function containsPhrase(
  message,
  phrases,
) {
  return phrases.some(
    (phrase) =>
      message.includes(
        phrase,
      ),
  )
}


function containsAnyWord(
  message,
  words,
) {
  return words.some(
    (word) =>
      message.includes(
        word,
      ),
  )
}


function findServiceId(
  normalizedMessage,
) {
  for (
    const [
      serviceId,
      aliases,
    ]
    of Object.entries(
      SERVICE_ALIASES,
    )
  ) {
    const matchedAlias =
      aliases.find(
        (alias) =>
          normalizedMessage.includes(
            alias,
          ),
      )

    if (matchedAlias) {
      return serviceId
    }
  }

  return null
}


function analyzeCredentialsRequest(
  message,
) {
  const normalizedMessage =
    normalizeMessage(
      message,
    )


  if (!normalizedMessage) {
    return {
      matched:
        false,

      confidence:
        0,

      reason:
        "Viesti on tyhjä.",

      action:
        null,

      serviceId:
        null,

      credentialsAction:
        null,
    }
  }


  if (
    containsPhrase(
      normalizedMessage,
      SECRET_PERMISSION_PHRASES,
    ) ||
    containsPhrase(
      normalizedMessage,
      SECRET_VALUE_PHRASES,
    )
  ) {
    return {
      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää salaisten credentials-arvojen lukemista koskevan pyynnön.",

      action:
        CREDENTIALS_MODULE_ACTIONS
          .EVALUATE_ACTION,

      serviceId:
        findServiceId(
          normalizedMessage,
        ),

      credentialsAction:
        "read_secret_value",
    }
  }


  if (
    containsPhrase(
      normalizedMessage,
      INSPECT_ALL_PHRASES,
    )
  ) {
    return {
      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää kaikkien palveluyhteyksien tarkistuspyynnön.",

      action:
        CREDENTIALS_MODULE_ACTIONS
          .INSPECT_ALL_SERVICES,

      serviceId:
        null,

      credentialsAction:
        null,
    }
  }


  const serviceId =
    findServiceId(
      normalizedMessage,
    )


  if (
    serviceId &&
    containsAnyWord(
      normalizedMessage,
      CONNECTION_WORDS,
    )
  ) {
    return {
      matched:
        true,

      confidence:
        0.98,

      reason:
        `Viesti sisältää palvelun "${serviceId}" yhteystilan tarkistuspyynnön.`,

      action:
        CREDENTIALS_MODULE_ACTIONS
          .INSPECT_SERVICE,

      serviceId,

      credentialsAction:
        null,
    }
  }


  if (
    serviceId &&
    (
      normalizedMessage.startsWith(
        "onko ",
      ) ||
      normalizedMessage.startsWith(
        "tarkista ",
      ) ||
      normalizedMessage.startsWith(
        "näytä ",
      )
    )
  ) {
    return {
      matched:
        true,

      confidence:
        0.9,

      reason:
        `Viesti sisältää palveluun "${serviceId}" liittyvän tarkistuspyynnön.`,

      action:
        CREDENTIALS_MODULE_ACTIONS
          .INSPECT_SERVICE,

      serviceId,

      credentialsAction:
        null,
    }
  }


  return {
    matched:
      false,

    confidence:
      0,

    reason:
      "Viesti ei sisällä tunnistettua credentials-pyyntöä.",

    action:
      null,

    serviceId:
      null,

    credentialsAction:
      null,
  }
}


function createControllerRequest(
  analysis,
) {
  if (
    analysis.action ===
    CREDENTIALS_MODULE_ACTIONS
      .INSPECT_SERVICE
  ) {
    return {
      action:
        CONTROLLER_ACTIONS
          .INSPECT_SERVICE,

      serviceId:
        analysis.serviceId,
    }
  }


  if (
    analysis.action ===
    CREDENTIALS_MODULE_ACTIONS
      .INSPECT_ALL_SERVICES
  ) {
    return {
      action:
        CONTROLLER_ACTIONS
          .INSPECT_ALL_SERVICES,
    }
  }


  if (
    analysis.action ===
    CREDENTIALS_MODULE_ACTIONS
      .EVALUATE_ACTION
  ) {
    return {
      action:
        CONTROLLER_ACTIONS
          .EVALUATE_ACTION,

      credentialsAction:
        analysis.credentialsAction,
    }
  }


  throw new Error(
    "Credentials Module sai tuntemattoman toiminnon.",
  )
}


function createCredentialsAnswer(
  controllerResult,
) {
  if (
    controllerResult?.message
  ) {
    return String(
      controllerResult.message,
    ).trim()
  }


  if (
    controllerResult?.success
  ) {
    return (
      "Credentials-pyyntö käsiteltiin onnistuneesti."
    )
  }


  return (
    "Credentials-pyyntöä ei voitu käsitellä."
  )
}


function createCredentialsModule() {
  return createBrainModule({
    id:
      "credentials",

    name:
      "Credentials Module",

    version:
      CREDENTIALS_MODULE_VERSION,

    description:
      "Tarkistaa palveluyhteyksien tilan ja arvioi credentials-toimintojen turvallisuuden paljastamatta salaisia arvoja.",

    priority:
      80,

    canHandle({
      request,
    }) {
      const analysis =
        analyzeCredentialsRequest(
          request?.message,
        )


      return {
        matched:
          analysis.matched,

        confidence:
          analysis.confidence,

        reason:
          analysis.reason,

        metadata:
          analysis.matched
            ? {
                action:
                  analysis.action,

                serviceId:
                  analysis.serviceId,

                credentialsAction:
                  analysis
                    .credentialsAction,
              }
            : null,
      }
    },

    async execute({
      message,
      request,
      runtimeContext,
    }) {
      const analysis =
        analyzeCredentialsRequest(
          message,
        )


      if (!analysis.matched) {
        throw new Error(
          "Credentials Module ei tunnistanut pyyntöä.",
        )
      }


      const controllerRequest =
        createControllerRequest(
          analysis,
        )


      const controllerResult =
        handleCredentialsRequest(
          controllerRequest,
        )


      const answer =
        createCredentialsAnswer(
          controllerResult,
        )


      return {
        type:
          "credentials_result",

        mode:
          analysis.action,

        answer,

        success:
          controllerResult.success,

        serviceId:
          analysis.serviceId,

        credentialsAction:
          analysis.credentialsAction,

        controller:
          controllerResult.controller ||
          "credentials",

        controllerAction:
          controllerResult.action ||
          null,

        data:
          controllerResult.data ||
          null,

        secretValuesExposed:
          false,

        requestId:
          request?.requestId ||
          null,

        source:
          runtimeContext?.source ||
          "ai-brain-v2",
      }
    },
  })
}


export {
  CREDENTIALS_MODULE_ACTIONS,
  CREDENTIALS_MODULE_VERSION,
  analyzeCredentialsRequest,
  createCredentialsModule,
}