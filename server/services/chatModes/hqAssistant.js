/*
 * Wood-Booster HQ - Spacemonkey HQ Assistant (keskustelun vain luku -työkalut)
 *
 * Kun HQ-keskustelun viesti on selvästi tietopyyntö jonka rekisteröity
 * kyvykkyys osaa (keskeneräiset projektit, avatun projektin yhteenveto,
 * Python-tiedoston tarkistus), vastaus haetaan oikeasta lähteestä eikä
 * kielimallilta. Kulku on BOOSTERVERSE_SPEC.md:n mukainen:
 *
 *   Planner (tämä tiedosto, deterministinen)
 *   -> Permission (vain workspace "hq" + oikeustaso "observe")
 *   -> Workflow -> Skill -> Tool -> ToolBus (plugins/HqAssistant,
 *      plugins/PythonDeveloper)
 *   tai -> Agent Runtime -> agentti (kyvykkyyden "agent"-kenttä,
 *      esim. Developer Agentin tiedostohaku)
 *
 * Kielimalli ei valitse eikä kutsu työkalua. Viesti jota planner ei
 * tunnista palaa tavalliseen keskusteluun (palauttaa null), ja viesti
 * jossa on muutospyyntö ("lisää", "korjaa"...) jätetään aina nykyisille
 * kirjoittaville poluille, joilla on oma hyväksyntäkiertonsa.
 */

import {
  getSpacemonkeyAgentRuntime,
  getSpacemonkeyCapabilityRegistry,
  getSpacemonkeyPluginManager,
  getSpacemonkeyToolBus,
  getSpacemonkeyWorkflowEngine,
} from "../spacemonkey/spacemonkeyRuntimeBootstrap.js"
import { DEFAULT_PROJECT_ROOT } from "../spacemonkey/agents/runtime/registerAgents.js"
import { isAccessAllowed } from "../spacemonkey/security/accessLevels.js"
import {
  PYTHON_REVIEW_MODEL,
  reviewPythonCode,
} from "../pythonCodeReviewer.js"
import { isValidPythonSyntax } from "../pythonSyntaxValidator.js"
import { createCachedModelResolver } from "../ollamaModelResolver.js"

export const HQ_WORKSPACE = "hq"

// Keskustelu suorittaa toistaiseksi vain observe-tason (vain luku)
// kyvykkyyksiä - ks. security/accessLevels.js.
const ALLOWED_ACCESS = ["observe"]

const AGENT_TASK_TIMEOUT_MS = 20000

const MAX_LISTED_FILES = 15

const MAX_LISTED_STEPS = 8

// JavaScriptin \b ja \w tuntevat vain ASCII-kirjaimet, joten esim.
// "tästä" tai "lisää" eivät osuisi niihin - sanarajat tehdään
// Unicode-kirjaimilla.
const LETTER = "[\\p{L}\\p{N}_]"

// Kokonainen sana (tai fraasi) jostain annetuista vaihtoehdoista.
function wholeWord(alternatives) {
  return new RegExp(`(?<!${LETTER})(?:${alternatives})(?!${LETTER})`, "iu")
}

// Sana joka alkaa jollain annetuista vartaloista ("projekt" -> projektini).
function wordStart(stems) {
  return new RegExp(`(?<!${LETTER})(?:${stems})`, "iu")
}

// Muutospyynnöt jätetään aina nykyisille kirjoittaville poluille.
// Tarkoituksella konservatiivinen: "kerro lisää" päätyy tavalliseen
// keskusteluun, mikä on harmitonta.
const WRITE_INTENT_PATTERN = wholeWord([
  "lisää", "lisätä", "lisäätkö", "lisäisitkö",
  "luo", "luoda", "luotko", "luoisitko",
  "poista", "poistaa", "poistatko", "poistaisitko",
  "muuta", "muuttaa", "muutatko", "muuttaisitko",
  "muokkaa", "muokata", "muokkaatko", "muokkaisitko",
  "päivitä", "päivittää", "päivitätkö", "päivittäisitkö",
  "merkitse", "merkitä", "merkitsetkö",
  "siirrä", "siirtää", "siirrätkö",
  "aseta", "asettaa", "vaihda", "vaihtaa",
  "korjaa", "korjata", "korjaatko", "korjaisitko",
  "paranna", "parantaa", "parannatko", "parantaisitko",
  "refaktoroi", "refaktoroida",
  "kirjoita", "kirjoittaa", "kirjoitatko",
  "lähetä", "lähettää", "lähetätkö",
  "hyväksy", "hyväksyä", "julkaise", "julkaista",
  "tallenna", "tallentaa", "nimeä",
].join("|"))

const PROJECT_WORD = wordStart("projekt")

const UNFINISHED_WORD = new RegExp(
  `${wordStart("keskeneräi|avoim|aktiivi|valmistumatt").source}` +
  `|${wholeWord("kesken|käynnissä|työn alla").source}`,
  "iu",
)

const SUMMARY_WORD = new RegExp(
  `${wordStart("yhteenve|tiivistelm|tilannekatsau").source}` +
  `|${wholeWord("tiivistä|tiivistäisitkö|tilanne").source}`,
  "iu",
)

const THIS_WORD = wholeWord("tästä|tämän|tämä|tätä|tähän|avatusta|avoimesta")

// Polku otetaan sellaisenaan (myös alkukauttaviiva), jotta polkurajaus
// hylkää absoluuttisen polun eikä sitä tulkita hiljaa projektin sisäiseksi.
const PY_PATH_PATTERN = /(?:^|[\s"'`(])(\/?(?:[\w.-]+\/)*[\w.-]+\.py)\b/i

const READ_VERB_PATTERN = wholeWord([
  "tarkista", "tarkistatko", "tarkistaisitko", "tarkasta",
  "katselmoi", "katselmoisitko", "katselmointi",
  "arvioi", "arvioisitko", "analysoi", "analysoisitko", "analyysi",
  "selitä", "selittäisitkö", "käy läpi", "review",
].join("|"))

const PYTHON_FILE_WORDS = /python[\s\S]*tiedosto|tiedosto[\s\S]*python/iu

const FIND_VERB_PATTERN = wholeWord([
  "etsi", "etsisitkö", "etsitkö", "hae", "hakisitko", "löydä", "löydätkö", "näytä",
].join("|"))

const FILE_WORD = wordStart("tiedosto")

const SEARCH_TERM_PATTERN = /^[\p{L}\p{N}._-]{2,60}$/u

const AGENT_WORD = wordStart("agent|aliagent")

// Project Atlas: "mitä HQ:ssa on rakennettu", "mikä on kehitystilanne",
// "mitä Wood-Booster HQ osaa".
const ATLAS_BUILT_WORD = wordStart("rakennettu|rakentanut|rakentamani|toteutettu|toteuttanut|kehitystilan")

const ATLAS_CAN_WORD = wholeWord("osaa|osaako")

const ATLAS_SUBJECT = wordStart("hq|wood-booster|järjestelm|spacemonkey")

const HAPPENING_WORD = wordStart("tapahtu")

const AGENT_QUESTION = wholeWord([
  "mitä", "mitkä", "listaa", "näytä", "kerro", "onko", "montako", "kuinka monta",
].join("|"))

// Hakusana: lainausmerkeissä, "nimellä X" tai viimeinen sana
// "tiedosto(t) X" -rakenteen jälkeen. Ei koskaan polkua.
function extractSearchTerm(value) {
  const candidates = [
    value.match(/["'`“”]([^"'`“”]{2,60})["'`“”]/u)?.[1],
    value.match(/(?:nimellä|nimeltä|nimeltään|nimessä(?: on)?|nimiset|nimisen)\s+([\p{L}\p{N}._-]+)/iu)?.[1],
    value.match(/tiedosto\p{L}*\s+([\p{L}\p{N}._-]+)[\s?.!]*$/iu)?.[1],
  ]

  const term = candidates
    .map(candidate => candidate?.trim().replace(/[.?!]+$/u, ""))
    .find(candidate => candidate && SEARCH_TERM_PATTERN.test(candidate))

  return term || null
}

function normalizeText(text) {
  return String(text || "").trim().replace(/\s+/g, " ")
}

/**
 * Deterministinen planner: { capabilityId, input } tai null.
 */
export function planHqAssistantTurn({ text } = {}) {
  const value = normalizeText(text)

  if (!value || WRITE_INTENT_PATTERN.test(value)) {
    return null
  }

  const pyPath = value.match(PY_PATH_PATTERN)?.[1] || null

  if (READ_VERB_PATTERN.test(value) && (pyPath || PYTHON_FILE_WORDS.test(value))) {
    return {
      capabilityId: "dev.python.inspect",
      input: { filePath: pyPath },
    }
  }

  if (FIND_VERB_PATTERN.test(value) && FILE_WORD.test(value)) {
    return {
      capabilityId: "dev.project.find-files",
      input: { search: extractSearchTerm(value) },
    }
  }

  if (AGENT_WORD.test(value) && AGENT_QUESTION.test(value)) {
    return {
      capabilityId: "spacemonkey.agents.inventory",
      input: {},
    }
  }

  if (ATLAS_BUILT_WORD.test(value) || (ATLAS_CAN_WORD.test(value) && ATLAS_SUBJECT.test(value))) {
    return {
      capabilityId: "hq.atlas.overview",
      input: { withProject: PROJECT_WORD.test(value) },
    }
  }

  if (PROJECT_WORD.test(value) && UNFINISHED_WORD.test(value)) {
    return {
      capabilityId: "hq.projects.unfinished",
      input: {},
    }
  }

  // "Mitä projektissani tapahtuu?" - avatun projektin yhteenveto, tai
  // keskeneräiset projektit jos mitään ei ole avattuna.
  if (PROJECT_WORD.test(value) && HAPPENING_WORD.test(value)) {
    return {
      capabilityId: "hq.projects.summary",
      input: { fallbackToUnfinished: true },
    }
  }

  if (SUMMARY_WORD.test(value) && (PROJECT_WORD.test(value) || THIS_WORD.test(value))) {
    return {
      capabilityId: "hq.projects.summary",
      input: {},
    }
  }

  return null
}

/**
 * Permission-vaihe. Palauttaa { allowed, reason }.
 */
export function checkCapabilityPermission(capability, { workspace = HQ_WORKSPACE } = {}) {
  if (!capability) {
    return { allowed: false, reason: "not-registered" }
  }

  if (capability.enabled === false) {
    return { allowed: false, reason: "disabled" }
  }

  if (capability.workspace !== workspace) {
    return { allowed: false, reason: "other-workspace" }
  }

  if (
    !isAccessAllowed(capability.access, ALLOWED_ACCESS) ||
    capability.mutates !== false ||
    capability.requiresApproval !== false
  ) {
    return { allowed: false, reason: "needs-write-access" }
  }

  return { allowed: true, reason: "read-only" }
}

function workflowIsRegistered(workflowEngine, id) {
  return Boolean(workflowEngine?.list?.().some(workflow => workflow.id === id))
}

/**
 * Onko kyvykkyys toimintakunnossa juuri nyt: { ready, missing }.
 */
export function checkCapabilityHealth(capability, { engines, prisma } = {}) {
  const missing = []

  if (capability?.workflows?.length && (!engines?.workflowEngine || !engines?.toolBus)) {
    missing.push("spacemonkey-runtime")
  }

  for (const id of capability?.workflows || []) {
    if (!workflowIsRegistered(engines?.workflowEngine, id)) {
      missing.push(`workflow:${id}`)
    }
  }

  if ((capability?.requires || []).includes("database") && !prisma) {
    missing.push("database")
  }

  if (capability?.agent) {
    if (!engines?.agentRuntime) {
      missing.push("agent-runtime")
    } else if (engines.agentRuntime.health(capability.agent).ready !== true) {
      missing.push(`agent:${capability.agent}`)
    }
  }

  return { ready: missing.length === 0, missing }
}

function defaultEngines() {
  return {
    toolBus: getSpacemonkeyToolBus(),
    workflowEngine: getSpacemonkeyWorkflowEngine(),
    capabilityRegistry: getSpacemonkeyCapabilityRegistry(),
    agentRuntime: getSpacemonkeyAgentRuntime(),
    pluginManager: getSpacemonkeyPluginManager(),
    projectRoot: DEFAULT_PROJECT_ROOT,
  }
}

/**
 * Project Atlas saman rekisteröidyn workflow'n kautta kuin keskustelussa
 * (myös GET /api/agents/atlas käyttää tätä).
 */
export async function readAtlas({ engines = defaultEngines() } = {}) {
  return runWorkflowSkill(
    engines.workflowEngine,
    "hq-atlas-overview-workflow",
    { toolBus: engines.toolBus, projectRoot: engines.projectRoot },
  )
}

/**
 * Agentti-inventaario saman rekisteröidyn workflow'n kautta kuin
 * keskustelussa (myös GET /api/agents/inventory käyttää tätä).
 */
export async function readAgentInventory({ engines = defaultEngines() } = {}) {
  const result = await runWorkflowSkill(
    engines.workflowEngine,
    "list-spacemonkey-agents-workflow",
    {
      toolBus: engines.toolBus,
      inventoryRuntime: {
        root: engines.projectRoot,
        agentRuntime: engines.agentRuntime,
        pluginManager: engines.pluginManager,
        capabilityRegistry: engines.capabilityRegistry,
      },
    },
  )

  return result
}

const resolveReviewModel = createCachedModelResolver({
  configured: PYTHON_REVIEW_MODEL,
})

/**
 * Kaikki HQ-työympäristön kyvykkyydet kuntotietoineen (GET-reitille ja
 * käyttöliittymälle: mitä Spacemonkey oikeasti osaa nyt).
 */
export function describeHqCapabilities({ engines = defaultEngines(), prisma = null } = {}) {
  const capabilities = engines?.capabilityRegistry?.list?.() || []

  return capabilities
    .filter(capability => capability.workspace === HQ_WORKSPACE)
    .map(capability => ({
      id: capability.id,
      name: capability.name,
      description: capability.description,
      workspace: capability.workspace,
      category: capability.category,
      access: capability.access,
      mutates: capability.mutates,
      requiresApproval: capability.requiresApproval,
      workflows: capability.workflows || [],
      agent: capability.agent || null,
      requires: capability.requires,
      optional: capability.optional || [],
      sources: capability.sources || [],
      plugin: capability.plugin,
      permission: checkCapabilityPermission(capability),
      health: checkCapabilityHealth(capability, { engines, prisma }),
    }))
}

function formatDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`
}

function formatUnfinished(result) {
  if (result.total === 0) {
    return "Keskeneräisiä projekteja ei ole - kaikkien projektien tila on Valmis."
  }

  const lines = result.projects.map(project => {
    const parts = [
      project.status,
      project.openSteps > 0
        ? plural(project.openSteps, "avoin työvaihe", "avointa työvaihetta")
        : "ei avoimia työvaiheita",
    ]

    const deadline = formatDate(project.deadline)

    if (deadline) {
      parts.push(`takaraja ${deadline}`)
    }

    return `- ${project.name} (#${project.id}) - ${parts.join(", ")}`
  })

  const header =
    `Keskeneräisiä projekteja on ${result.total} ` +
    "(tila jokin muu kuin Valmis), viimeksi päivitetyt ensin:"

  const footer = result.truncated
    ? `\n\nNäytetään ${result.projects.length} viimeksi päivitettyä.`
    : ""

  return `${header}\n\n${lines.join("\n")}${footer}`
}

function formatSummary(project) {
  const lines = [`${project.name} (#${project.id}) - tila: ${project.status}`]

  if (project.customerName) {
    lines.push(`Asiakas: ${project.customerName}`)
  }

  const deadline = formatDate(project.deadline)

  lines.push(deadline ? `Takaraja: ${deadline}` : "Takarajaa ei ole asetettu.")

  if (project.description) {
    lines.push(`Kuvaus: ${project.description.slice(0, 200)}`)
  }

  const steps = project.workflowSteps || []
  const openSteps = steps.filter(step => !step.done)

  if (steps.length === 0) {
    lines.push("Työvaiheita ei ole vielä lisätty.")
  } else {
    const shown = openSteps.slice(0, MAX_LISTED_STEPS).map(step => step.title)
    const more = openSteps.length > shown.length
      ? ` (+${openSteps.length - shown.length} muuta)`
      : ""

    lines.push(
      `Työvaiheet: ${steps.length - openSteps.length}/${steps.length} tehty.` +
      (openSteps.length > 0 ? ` Avoimena: ${shown.join(", ")}${more}.` : ""),
    )
  }

  const tasks = project.timelineTasks || []

  if (tasks.length > 0) {
    const next = tasks.find(task => !task.completed)
    const nextText = next
      ? ` Seuraava: ${next.name}${next.deadline ? ` (${next.deadline})` : ""}.`
      : ""

    lines.push(
      `Aikataulu: ${tasks.filter(task => task.completed).length}/${tasks.length} ` +
      `tehtävää valmiina.${nextText}`,
    )
  }

  lines.push(
    project.quote
      ? `Tarjous: ${project.quote.quoteNumber}, tila ${project.quote.status}.`
      : "Tarjousta ei ole vielä tehty.",
  )

  const counts = project.counts || {}

  lines.push(
    `Materiaaleja ${counts.materials ?? 0}, tiedostoja ${counts.files ?? 0}, ` +
    `muistiinpanoja ${counts.notes ?? 0}.`,
  )

  if (project.latestNote) {
    lines.push(
      `Viimeisin muistiinpano (${formatDate(project.latestNote.createdAt)}): ` +
      `"${project.latestNote.excerpt}"`,
    )
  }

  return lines.join("\n")
}

function formatInspection(facts) {
  const lines = [`Tarkistin tiedoston ${facts.relativePath} (vain luku).`, ""]

  const functionText = facts.functionCount > 0
    ? `${plural(facts.functionCount, "funktio", "funktiota")} (${facts.functions.join(", ")}${facts.functionCount > facts.functions.length ? ", ..." : ""})`
    : "ei funktioita"

  const classText = facts.classCount > 0
    ? `${plural(facts.classCount, "luokka", "luokkaa")} (${facts.classes.join(", ")})`
    : "ei luokkia"

  lines.push(`- ${plural(facts.lines, "rivi", "riviä")}, ${functionText}, ${classText}`)

  if (facts.importCount > 0) {
    lines.push(`- Importit: ${facts.imports.join(", ")}`)
  }

  if (facts.syntaxValid === true) {
    lines.push("- Syntaksi: kunnossa (Python kääntää tiedoston).")
  } else if (facts.syntaxValid === false) {
    lines.push("- Syntaksi: Python EI käännä tiedostoa - siinä on syntaksivirhe.")
  } else {
    lines.push("- Syntaksia ei voitu tarkistaa.")
  }

  if (facts.todoCount > 0) {
    lines.push(`- TODO/FIXME-merkintöjä: ${facts.todoCount}`)
  }

  return lines.join("\n")
}

function toolRunFor(capability, extra = {}) {
  return {
    capabilityId: capability.id,
    name: capability.name,
    workspace: capability.workspace,
    access: capability.access,
    workflows: capability.workflows || [],
    agent: capability.agent || null,
    sources: capability.sources || [],
    mutated: false,
    ...extra,
  }
}

function reply({ success = true, answer, toolRun }) {
  return {
    status: 200,
    body: {
      success,
      agent: "spacemonkey",
      reason: "hq read-only capability",
      answer,
      toolRun,
    },
  }
}

async function runWorkflowSkill(workflowEngine, workflowId, context) {
  const result = await workflowEngine.execute(workflowId, context)

  return result.results?.[0] || { success: false, error: "Työnkulku ei palauttanut tulosta." }
}

const FILE_ROLE_TEXT = {
  "React Page Component": "sivu",
  "React UI Component": "käyttöliittymäkomponentti",
  "Backend API Route": "palvelimen reitti",
  "Backend Service": "palvelimen palvelu",
  "Database Schema": "tietokantamalli",
  "Build Configuration": "build-asetus",
  "Test File": "testi",
  "Project Configuration": "projektin asetus",
  Unknown: "muu",
}

function formatFoundFiles(result) {
  if (result.total === 0) {
    return (
      `Developer Agent ei löytänyt projektista tiedostoja, joiden nimessä on "${result.search}".` +
      (result.hiddenProtected > 0
        ? ` (${plural(result.hiddenProtected, "suojattu tiedosto jätettiin", "suojattua tiedostoa jätettiin")} pois.)`
        : "")
    )
  }

  const shown = result.files.slice(0, MAX_LISTED_FILES)
  const lines = shown.map(
    file => `- ${file.path} (${FILE_ROLE_TEXT[file.role] || file.role})`,
  )

  const notes = []

  if (result.total > shown.length) {
    notes.push(`Näytetään ${shown.length}/${result.total}.`)
  }

  if (result.hiddenProtected > 0) {
    notes.push(
      `${plural(result.hiddenProtected, "suojattu tiedosto", "suojattua tiedostoa")} ` +
      "(salaisuudet, avaimet, tietokannat) jätettiin pois.",
    )
  }

  notes.push("Tiedostojen sisältöä ei luettu.")

  return [
    `Developer Agent löysi ${plural(result.total, "tiedoston", "tiedostoa")}, joiden nimessä on "${result.search}":`,
    "",
    ...lines,
    "",
    notes.join(" "),
  ].join("\n")
}

function formatAgentInventory(inventory) {
  const lines = [
    `Spacemonkeyn agentit (haara ${inventory.branch || "?"}, commit ${inventory.commit || "?"}) - ` +
    "luettu nyt koodista ja ajossa olevasta Agent Runtimesta.",
    "",
    `Agent Runtime: ${plural(inventory.runtimeAgents.length, "rekisteröity agentti", "rekisteröityä agenttia")}`,
  ]

  for (const agent of inventory.runtimeAgents) {
    const health = agent.health.ready === true
      ? "toimintakunnossa"
      : agent.health.ready === false
        ? `EI toimintakunnossa (puuttuu: ${agent.health.missing.join(", ")})`
        : "toimintakunto tuntematon (ei kuntotarkistusta)"

    const capabilities = (agent.capabilities || [])
      .map(capability => `${capability.name} (${ACCESS_TEXT[capability.access] || capability.access})`)
      .join(", ") || "ei kuvattuja kyvykkyyksiä"

    const selectable = agent.selectableFromChat.length > 0
      ? "valittavissa keskustelusta"
      : "ei valittavissa keskustelusta"

    const tests = agent.tests.length > 0
      ? `testitiedostoja ${agent.tests.filter(test => test.exists).length}/${agent.tests.length} löytyy (ei ajettu tässä)`
      : "ei testejä"

    const overlaps = agent.overlapsWith.length > 0
      ? ` Päällekkäinen vastuu: ${agent.overlapsWith.join(", ")}.`
      : ""

    lines.push(`- ${agent.name}: ${health}. Kyvykkyys: ${capabilities}; ${selectable}; ${tests}.${overlaps}`)
  }

  const personas = inventory.chatPersonas.personas
  const withContext = personas.filter(persona => persona.ownContext).map(persona => persona.id)
  const withoutContext = personas.filter(persona => !persona.ownContext).map(persona => persona.id)

  lines.push(
    "",
    `Keskustelun agenttireititin: ${plural(personas.length, "kehotepersoona", "kehotepersoonaa")} ` +
    "(valitsevat vastauksen kontekstin, eivät käytä työkaluja). " +
    `Oma konteksti: ${withContext.join(", ") || "-"}; ilman omaa kontekstia: ${withoutContext.join(", ") || "-"}.`,
    "",
    `Pluginit (eivät agentteja): ${inventory.plugins.map(plugin => plugin.id).join(", ")}.`,
  )

  const findings = []

  for (const claim of inventory.staticClaims) {
    findings.push(
      `${claim.id} väittää tilaksi "${claim.claims.state}" ja agenttien määräksi ${claim.claims.totalAgents} - kiinteä raportti, ei todiste.`,
    )
  }

  for (const item of inventory.agentClasses.filter(entry => !entry.loadedByServer)) {
    findings.push(`${item.className} (${item.file}) ei lataudu palvelimessa.`)
  }

  const claimedActive = personas.filter(persona => persona.claimedStatus === "Active" && !persona.ownContext)

  if (claimedActive.length > 0) {
    findings.push(
      `Rekisteri merkitsee aktiiviseksi myös persoonat ilman omaa kontekstia: ${claimedActive.map(persona => persona.id).join(", ")}.`,
    )
  }

  if (inventory.hearthwoodFilesSkipped > 0) {
    findings.push(
      `Hearthwoodin tiedostoja ei tutkittu (${inventory.hearthwoodFilesSkipped} ohitettu) - erillinen projekti.`,
    )
  }

  if (findings.length > 0) {
    lines.push("", "Huomioita:", ...findings.map(finding => `- ${finding}`))
  }

  return lines.join("\n")
}

const DOMAIN_TEXT = {
  business: "Liiketoiminta",
  creative: "Media ja markkinointi",
  workshop: "Verstas",
  development: "Kehitys",
  trust: "Luotettavuus ja palautus",
  workspace: "Työtila",
  ai: "Yhteinen AI-ydin",
}

const UNKNOWN_REASON_TEXT = {
  "no-known-code": "toteutusta ei tunneta (ei koodipolkua Atlasissa)",
  "not-found": "koodia ei löytynyt mistään paikallisesta haarasta",
  partial: "osa koodista puuttuu",
  "not-wired": "koodi on olemassa, mutta palvelin tai sovellus ei lataa sitä",
}

function formatAtlas(atlas) {
  const byStatus = status => atlas.systems.filter(system => system.status === status)

  const lines = [
    `Wood-Booster HQ - mitä on rakennettu (haara ${atlas.branch || "?"}, commit ${atlas.commit || "?"}` +
    (atlas.stableRef ? `; vakaa haara ${atlas.stableRef} ${atlas.stableCommit}` : "") +
    "). Luettu nyt lähdekoodista ja git-haaroista.",
  ]

  const implemented = byStatus("implemented")

  if (implemented.length > 0) {
    lines.push(
      "",
      `Toteutettu (${implemented.length}) - koodi on olemassa, palvelin tai sovellus lataa sen, ja se on vakaassa haarassa:`,
    )

    const domains = [...new Set(implemented.map(system => system.domain))]

    for (const domain of domains) {
      const names = implemented
        .filter(system => system.domain === domain)
        .map(system =>
          system.tests.found.length > 0
            ? `${system.name} (${plural(system.tests.found.length, "testitiedosto", "testitiedostoa")})`
            : system.name,
        )

      lines.push(`- ${DOMAIN_TEXT[domain] || domain}: ${names.join(", ")}`)
    }
  }

  const developing = byStatus("in-development")

  if (developing.length > 0) {
    lines.push("", `Kehitteillä (${developing.length}):`)

    for (const system of developing) {
      const where = system.reason === "this-branch"
        ? `vain tässä haarassa (${system.where.join(", ")}), ei vielä vakaassa`
        : `haarassa ${system.where.join(", ")}`

      lines.push(`- ${system.name}: ${where}`)
    }
  }

  const planned = byStatus("planned")

  if (planned.length > 0) {
    lines.push("", `Suunniteltu, ei koodia (${planned.length}):`)

    for (const system of planned) {
      lines.push(`- ${system.name}: ${system.docs.filter(doc => doc.exists).map(doc => doc.path).join(", ")}`)
    }
  }

  const deprecated = byStatus("deprecated")

  if (deprecated.length > 0) {
    lines.push("", `Vanhentunut (${deprecated.length}): ${deprecated.map(system => system.name).join(", ")}`)
  }

  const unknown = byStatus("unknown")

  if (unknown.length > 0) {
    lines.push("", `Epävarma (${unknown.length}):`)

    for (const system of unknown) {
      lines.push(`- ${system.name}: ${UNKNOWN_REASON_TEXT[system.reason] || system.reason}`)
    }
  }

  lines.push(
    "",
    "Testattu: tässä haussa ei mitään, koska Atlas ei aja testejä. " +
    `Testitiedostoja löytyi ${plural(atlas.systems.filter(system => system.tests.found.length > 0).length, "järjestelmältä", "järjestelmältä")}.`,
    atlas.hearthwood.note,
  )

  return lines.join("\n")
}

function formatLiveView(runtimeContext) {
  const route = runtimeContext?.route
  const pathname = runtimeContext?.location?.pathname

  if (!route?.pageName && !pathname) {
    return null
  }

  return `Näkymä nyt: ${route?.pageName || "tuntematon"}${pathname ? ` (${pathname})` : ""}.`
}

const ACCESS_TEXT = {
  observe: "vain luku",
  workspace: "oma työtila",
  "project-draft": "muutosluonnos",
  "approved-execution": "hyväksytty suoritus",
  "privileged-os": "järjestelmän ylläpito",
  "external-publishing": "ulkoinen julkaisu",
}

const TASK_STATE_TEXT = {
  rejected: "agenttia ei voitu valita",
  failed: "agentin tehtävä epäonnistui",
  "timed-out": "agentti ei ehtinyt aikarajassa",
  cancelled: "tehtävä keskeytettiin",
}

const CAPABILITY_HANDLERS = {
  async "hq.projects.unfinished"({ capability, engines, prisma }) {
    const result = await runWorkflowSkill(
      engines.workflowEngine,
      "hq-list-unfinished-projects-workflow",
      { toolBus: engines.toolBus, prisma },
    )

    if (!result.success) {
      return reply({
        success: false,
        answer: `Projektitietojen haku epäonnistui: ${result.error}`,
        toolRun: toolRunFor(capability, { outcome: "failed", code: result.code }),
      })
    }

    return reply({
      answer: formatUnfinished(result),
      toolRun: toolRunFor(capability, { outcome: "ok", count: result.total }),
    })
  },

  async "hq.projects.summary"({ capability, engines, prisma, runtimeContext, input }) {
    const projectId = Number(runtimeContext?.activeProject?.id)

    if ((!Number.isInteger(projectId) || projectId <= 0) && input.fallbackToUnfinished) {
      return runHqAssistantTurn({
        plan: { capabilityId: "hq.projects.unfinished", input: {} },
        runtimeContext,
        prisma,
        engines,
      })
    }

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return reply({
        answer:
          "Mitään projektia ei ole nyt avattuna, joten en tiedä mistä " +
          "projektista teen yhteenvedon. Avaa projekti Projektit-sivulta ja " +
          "kysy uudelleen - tai kysy \"Mitkä projektini ovat keskeneräisiä?\".",
        toolRun: toolRunFor(capability, { outcome: "needs-project" }),
      })
    }

    const result = await runWorkflowSkill(
      engines.workflowEngine,
      "hq-summarize-project-workflow",
      { toolBus: engines.toolBus, prisma, projectId },
    )

    if (!result.success) {
      return reply({
        success: false,
        answer: `Projektin tietojen haku epäonnistui: ${result.error}`,
        toolRun: toolRunFor(capability, { outcome: "failed", code: result.code, projectId }),
      })
    }

    return reply({
      answer: formatSummary(result.project),
      toolRun: toolRunFor(capability, { outcome: "ok", projectId }),
    })
  },

  async "hq.atlas.overview"({ capability, engines, prisma, runtimeContext, input }) {
    const result = await readAtlas({ engines })

    if (!result.success) {
      return reply({
        success: false,
        answer: `Projektikartan kokoaminen epäonnistui: ${result.error}`,
        toolRun: toolRunFor(capability, { outcome: "failed", code: result.code }),
      })
    }

    const parts = [formatAtlas(result.atlas)]
    const extra = {
      branch: result.atlas.branch,
      commit: result.atlas.commit,
      counts: result.atlas.counts,
    }

    if (input.withProject) {
      const view = formatLiveView(runtimeContext)

      // Projektiosa käyttää samoja rekisteröityjä kyvykkyyksiä kuin
      // suorat kysymykset, oikeustarkistuksineen.
      const projectPlan = Number(runtimeContext?.activeProject?.id) > 0
        ? { capabilityId: "hq.projects.summary", input: {} }
        : { capabilityId: "hq.projects.unfinished", input: {} }

      const project = await runHqAssistantTurn({
        plan: projectPlan,
        runtimeContext,
        prisma,
        engines,
      })

      parts.push(
        ["Projektisi:", view, project.body.answer].filter(Boolean).join("\n"),
      )

      extra.project = {
        capabilityId: projectPlan.capabilityId,
        outcome: project.body.toolRun?.outcome || null,
        projectId: project.body.toolRun?.projectId || null,
      }
    }

    return reply({
      answer: parts.join("\n\n"),
      toolRun: toolRunFor(capability, { outcome: "ok", ...extra }),
    })
  },

  async "spacemonkey.agents.inventory"({ capability, engines }) {
    const result = await readAgentInventory({ engines })

    if (!result.success) {
      return reply({
        success: false,
        answer: `Agenttien kartoitus epäonnistui: ${result.error}`,
        toolRun: toolRunFor(capability, { outcome: "failed", code: result.code }),
      })
    }

    return reply({
      answer: formatAgentInventory(result.inventory),
      toolRun: toolRunFor(capability, {
        outcome: "ok",
        count: result.inventory.runtimeAgents.length,
        branch: result.inventory.branch,
        commit: result.inventory.commit,
      }),
    })
  },

  async "dev.project.find-files"({ capability, engines, input }) {
    if (!input.search) {
      return reply({
        answer:
          "Kerro mitä tiedostonimeä etsin, esimerkiksi: " +
          "\"etsi tiedostot nimellä ChatPanel\".",
        toolRun: toolRunFor(capability, { outcome: "needs-term" }),
      })
    }

    const task = await engines.agentRuntime.run({
      capabilityId: capability.id,
      workspace: HQ_WORKSPACE,
      allowedAccess: ALLOWED_ACCESS,
      input: { search: input.search },
      timeoutMs: AGENT_TASK_TIMEOUT_MS,
    })

    const taskInfo = {
      agentId: task.agentId,
      taskId: task.id,
      taskState: task.state,
    }

    if (task.state !== "succeeded") {
      return reply({
        success: false,
        answer:
          `Tiedostohaku ei onnistunut: ${TASK_STATE_TEXT[task.state] || task.state}` +
          (task.error ? ` (${task.error}).` : "."),
        toolRun: toolRunFor(capability, { outcome: "failed", ...taskInfo }),
      })
    }

    return reply({
      answer: formatFoundFiles(task.result),
      toolRun: toolRunFor(capability, {
        outcome: "ok",
        count: task.result.total,
        ...taskInfo,
      }),
    })
  },

  async "dev.python.inspect"({ capability, engines, input, deps }) {
    if (!input.filePath) {
      return reply({
        answer:
          "Kerro minkä Python-tiedoston tarkistan, polkuna projektin " +
          "juuresta, esimerkiksi: \"tarkista tiedosto agent.py\".",
        toolRun: toolRunFor(capability, { outcome: "needs-file" }),
      })
    }

    const facts = await runWorkflowSkill(
      engines.workflowEngine,
      "inspect-python-workflow",
      {
        filePath: input.filePath,
        toolBus: engines.toolBus,
        isValidPythonSyntax: deps.isValidPythonSyntax,
      },
    )

    if (!facts.success) {
      return reply({
        success: false,
        answer: `En voinut tarkistaa tiedostoa ${input.filePath}: ${facts.error}`,
        toolRun: toolRunFor(capability, { outcome: "failed", code: facts.code }),
      })
    }

    const base = formatInspection(facts)
    const resolved = await deps.resolveReviewModel()

    if (!resolved.model) {
      return reply({
        answer:
          `${base}\n\nKielimallin katselmointia ei tehty: ${resolved.message} ` +
          "Yllä olevat tiedot on tarkistettu ilman kielimallia.",
        toolRun: toolRunFor(capability, {
          outcome: "ok-without-model",
          filePath: facts.relativePath,
          model: null,
        }),
      })
    }

    try {
      const review = await runWorkflowSkill(
        engines.workflowEngine,
        "review-python-workflow",
        {
          filePath: input.filePath,
          toolBus: engines.toolBus,
          reviewPythonCode: ({ code }) =>
            deps.reviewPythonCode({ code, model: resolved.model }),
        },
      )

      if (!review.success) {
        throw new Error(review.error || "katselmointi epäonnistui")
      }

      return reply({
        answer:
          `${base}\n\nKatselmointi (kielimallin ${resolved.model} arvio, ` +
          `ei testattu tulos):\n\n${review.review}`,
        toolRun: toolRunFor(capability, {
          outcome: "ok",
          filePath: facts.relativePath,
          model: resolved.model,
        }),
      })
    } catch (error) {
      return reply({
        answer:
          `${base}\n\nKielimallin katselmointi epäonnistui: ${error.message} ` +
          "Yllä olevat tiedot on tarkistettu ilman kielimallia.",
        toolRun: toolRunFor(capability, {
          outcome: "ok-without-model",
          filePath: facts.relativePath,
          model: resolved.model,
          modelError: error.message,
        }),
      })
    }
  },
}

/**
 * Suorittaa plannerin valitseman kyvykkyyden. Palauttaa { status, body }.
 */
export async function runHqAssistantTurn({
  plan,
  runtimeContext = null,
  prisma = null,
  engines = defaultEngines(),
  deps = {},
} = {}) {
  const capability = engines?.capabilityRegistry?.get?.(plan?.capabilityId) || null

  if (!capability) {
    return reply({
      success: false,
      answer:
        "Tähän tarvittavaa työkalua ei ole rekisteröity Spacemonkeylle, " +
        "joten en arvaa vastausta.",
      toolRun: {
        capabilityId: plan?.capabilityId || null,
        outcome: "not-registered",
        mutated: false,
      },
    })
  }

  const permission = checkCapabilityPermission(capability)

  if (!permission.allowed) {
    return reply({
      success: false,
      answer:
        "En voi käyttää tätä toimintoa keskustelusta: se vaatisi " +
        "oikeuksia joita keskustelulla ei ole.",
      toolRun: toolRunFor(capability, { outcome: "denied", reason: permission.reason }),
    })
  }

  const health = checkCapabilityHealth(capability, { engines, prisma })
  const handler = CAPABILITY_HANDLERS[capability.id]

  if (!health.ready || !handler) {
    return reply({
      success: false,
      answer:
        `${capability.name} ei ole juuri nyt käytettävissä ` +
        `(puuttuu: ${health.missing.join(", ") || "suoritustapa"}).`,
      toolRun: toolRunFor(capability, { outcome: "unavailable", missing: health.missing }),
    })
  }

  return handler({
    capability,
    engines,
    prisma,
    runtimeContext,
    input: plan.input || {},
    deps: {
      isValidPythonSyntax,
      reviewPythonCode,
      resolveReviewModel,
      ...deps,
    },
  })
}
