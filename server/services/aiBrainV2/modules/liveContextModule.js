/*
=====================================
WOOD-BOOSTER AI BRAIN V2

LIVE CONTEXT MODULE

Vastuut:
- tunnistaa kysymykset käyttäjän
  nykyisestä tilanteesta
- lukee jo saapuvan runtimeContextin
  (route, activeProject, activeCustomer,
  activeTab, selectedItems, metadata)
- valitsee ykkösfokuksen olemassa olevalla
  Spacemonkey Attention Enginellä
- muistaa viimeisimmän tunnetun fokuksen
  palvelimen muistissa

Tämä tiedosto ei:
- rakenna runtimeContextia uudestaan
  (se tulee frontendiltä, ks.
  src/services/runtime/runtimeContext.js)
- kirjoita tietokantaan
- kutsu kielimallia
- muuta muita AI Brain -moduuleja

Tämä on silta, ei uudelleenkirjoitus:
käyttää olemassa olevaa, tähän asti
kytkemätöntä Attention Enginea
tilannekuvan pisteytykseen.
=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"

import {
  selectFocus,
} from "../system/spacemonkey/spacemonkeyAttentionEngine.js"


const CONTEXT_QUERY_PHRASES = [
  "missä olen",
  "missä projektissa",
  "mikä projekti on auki",
  "mitä teen nyt",
  "mikä on tilanne",
  "mitä täällä tapahtuu",
  "mitä pitäisi tehdä seuraavaksi",
  "mitä olin tekemässä",
  "muistatko mitä olin tekemässä",
  "missä vaiheessa projekti on",
  "mikä on nykyinen tilanne",
]


const LAST_FOCUS_KEY =
  "default"

const lastKnownFocusStore =
  new Map()


function normalizeMessage(message) {
  return String(message || "")
    .trim()
    .toLowerCase()
}


function containsContextQuery(message) {
  return CONTEXT_QUERY_PHRASES.some(
    (phrase) => message.includes(phrase),
  )
}


function safeObject(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {}
  }

  return value
}


function safeArray(value) {
  return Array.isArray(value)
    ? value
    : []
}


function hasEntries(value) {
  return Object.keys(safeObject(value)).length > 0
}


function buildFocusOptions(runtimeContext) {
  const route =
    safeObject(runtimeContext.route)

  const activeProject =
    safeObject(runtimeContext.activeProject)

  const activeCustomer =
    safeObject(runtimeContext.activeCustomer)

  const metadata =
    safeObject(runtimeContext.metadata)

  const missingMaterials =
    safeArray(metadata.missingMaterials)

  const options = []

  if (hasEntries(activeProject)) {
    options.push({
      goal:
        `Projekti: ${activeProject.name || activeProject.id}`,

      task:
        runtimeContext.activeTab ||
        route.pageName ||
        "yleiskatsaus",

      priority: 0.9,
      relevance: 0.9,
      contextImportance: 0.8,

      distraction:
        missingMaterials.length > 0
          ? 0.1
          : 0,
    })
  }

  if (hasEntries(activeCustomer)) {
    options.push({
      goal:
        `Asiakas: ${activeCustomer.name || activeCustomer.id}`,

      task:
        route.pageName ||
        "asiakasnäkymä",

      priority: 0.6,
      relevance: 0.6,
      contextImportance: 0.5,
      distraction: 0,
    })
  }

  options.push({
    goal:
      route.pageName ||
      "Wood-Booster OS",

    task:
      route.pageType ||
      "yleisnäkymä",

    priority: 0.4,
    relevance: 0.4,
    contextImportance: 0.3,
    distraction: 0,
  })

  return options
}


function buildContextSnapshot(runtimeContext) {
  const safeContext =
    safeObject(runtimeContext)

  const focusOptions =
    buildFocusOptions(safeContext)

  const focus =
    focusOptions.length > 0
      ? selectFocus({ options: focusOptions })
      : null

  const snapshot = {
    route:
      safeObject(safeContext.route),

    activeProject:
      safeObject(safeContext.activeProject),

    activeCustomer:
      safeObject(safeContext.activeCustomer),

    activeTab:
      safeContext.activeTab || null,

    selectedItems:
      safeArray(safeContext.selectedItems),

    metadata:
      safeObject(safeContext.metadata),

    focus,

    capturedAt:
      new Date().toISOString(),
  }

  lastKnownFocusStore.set(
    LAST_FOCUS_KEY,
    snapshot,
  )

  return snapshot
}


function getLastKnownFocus() {
  return (
    lastKnownFocusStore.get(LAST_FOCUS_KEY) ||
    null
  )
}


function createLiveContextModule() {

  return createBrainModule({

    id:
      "live_context",


    name:
      "Live Context Module",


    version:
      "1.0.0",


    description:
      "Tulkitsee jo saapuvan runtimeContextin ja kertoo käyttäjän " +
      "nykyisen tilanteen (projekti, asiakas, välilehti, fokus).",


    priority:
      65,



    canHandle({
      request,
    }) {

      const message =
        normalizeMessage(
          request?.message,
        )

      const matched =
        message.length > 0 &&
        containsContextQuery(message)

      return {

        matched,

        confidence:
          matched
            ? 0.9
            : 0,

        reason:
          matched
            ? "Käyttäjä kysyi nykyisestä tilanteesta."
            : "Ei tilannekysymystä.",

      }

    },



    async execute({

      request,

      runtimeContext,

    }) {

      const snapshot =
        buildContextSnapshot(
          runtimeContext,
        )

      return {

        type:
          "context_result",


        requestId:
          request?.requestId ||
          null,


        source:
          "liveContextModule.js",


        snapshot,

      }

    },

  })

}


export {
  createLiveContextModule,
  getLastKnownFocus,
}
