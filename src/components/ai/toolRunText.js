/*
 * Spacemonkeyn HQ-keskustelun työkalurivi: kertoo käyttäjälle selkeällä
 * suomella mitä rekisteröityä työkalua vastaukseen käytettiin, oliko se
 * vain luku, ja muuttiko se mitään (PRD: "käyttäjä näkee mitä
 * Spacemonkey tekee"). Puhdas funktio, jotta sen voi testata ilman
 * selainta - backendin toolRun-kenttä tulee
 * server/services/chatModes/hqAssistant.js:stä.
 */

const OUTCOME_TEXT = {
  ok: null,
  "ok-without-model": "ilman kielimallia",
  "needs-project": "odottaa avattua projektia",
  "needs-file": "odottaa tiedoston polkua",
  "needs-term": "odottaa hakusanaa",
  failed: "epäonnistui",
  denied: "estetty - vaatisi kirjoitusoikeuden",
  unavailable: "ei käytettävissä nyt",
  "not-registered": "työkalua ei ole rekisteröity",
}

// Samat tasot kuin server/services/spacemonkey/security/accessLevels.js.
const ACCESS_TEXT = {
  observe: "vain luku",
  workspace: "oma työtila",
  "project-draft": "muutosluonnos",
  "approved-execution": "hyväksytty suoritus",
  "privileged-os": "järjestelmän ylläpito",
  "external-publishing": "ulkoinen julkaisu",
}

export function describeToolRun(toolRun) {
  if (!toolRun || typeof toolRun !== "object") {
    return null
  }

  const parts = [`Spacemonkey käytti: ${toolRun.name || toolRun.capabilityId || "tuntematon työkalu"}`]

  if (ACCESS_TEXT[toolRun.access]) {
    parts.push(ACCESS_TEXT[toolRun.access])
  }

  const outcome = OUTCOME_TEXT[toolRun.outcome]

  if (outcome) {
    parts.push(outcome)
  }

  if (toolRun.mutated === false) {
    parts.push("mitään ei muutettu")
  } else if (toolRun.changedOnly === "spacemonkey-workspace" && toolRun.projectDataChanged === false) {
    parts.push("vain Spacemonkeyn oma työtila muuttui")
  } else {
    parts.push("muutokset tarkistettava")
  }

  if (toolRun.agentId) {
    parts.push(`agentti ${toolRun.agentId}`)
  }

  if (toolRun.model) {
    parts.push(`malli ${toolRun.model}`)
  }

  const sources = Array.isArray(toolRun.sources) && toolRun.sources.length > 0
    ? `Lähteet: ${toolRun.sources.join(", ")}`
    : null

  return { summary: parts.join(" · "), sources }
}
