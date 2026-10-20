// Hearthwood Dev Studio - Project Overview (Studio Home), pure part.
//
// Purpose: turn the Studio's real sources into the few facts Studio Home
// shows. A source that failed or returned nothing gives `null` - the card
// then says "not available"; nothing is estimated or invented.
// Sources (all existing GET endpoints):
//   /hearthwood-patchbay/overview      -> content counts per list
//   /hearthwood-patchbay?archived=false -> every change and its own check
//   /hearthwood-patchbay/doctor         -> data + tool health check
//   /hearthwood-dev/status              -> Spacemonkey service
// Public API: summarizeContent, summarizeChanges, summarizeHealth,
//   summarizeSpacemonkey, suggestNextSteps
// Tests: projectOverview.test.mjs

const IN_GAME = new Set(["applied", "qa_running", "qa_passed", "qa_failed"])

export function summarizeContent(overview, labelFor = type => type) {
  if (!overview || !Array.isArray(overview.types)) return null
  const lists = overview.types.filter(entry => Number.isFinite(entry?.count) && entry.count > 0)
  if (!lists.length) return null
  const sorted = [...lists].sort((a, b) => b.count - a.count)
  return {
    total: lists.reduce((sum, entry) => sum + entry.count, 0),
    lists: lists.length,
    top: sorted.slice(0, 3).map(entry => ({ label: labelFor(entry.type), count: entry.count })),
  }
}

export function summarizeChanges(rows) {
  if (!Array.isArray(rows)) return null
  const inGame = rows.filter(row => IN_GAME.has(row?.status))
  const latest = [...inGame].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0] || null
  return {
    inGame: inGame.length,
    checksPassed: rows.filter(row => row?.status === "qa_passed").length,
    checksFailed: rows.filter(row => row?.status === "qa_failed").length,
    checksRunning: rows.filter(row => row?.status === "qa_running").length,
    waitingPreviews: rows.filter(row => row?.status === "previewing").length,
    latest: latest ? { summary: String(latest.summary || "").slice(0, 120), at: latest.updatedAt || latest.createdAt || null, status: latest.status } : null,
  }
}

export function summarizeHealth(doctor) {
  if (!doctor || !Array.isArray(doctor.checks)) return null
  const failing = doctor.checks.filter(check => check && check.ok === false).map(check => String(check.name || "?"))
  return { healthy: doctor.healthy === true && failing.length === 0, checks: doctor.checks.length, failing }
}

export function summarizeSpacemonkey(status) {
  if (!status || status.success !== true) return null
  return {
    capabilities: Array.isArray(status.capabilities) ? status.capabilities.length : 0,
    automaticExecution: status.toolRouter?.automaticExecution === true,
  }
}

/**
 * "Spacemonkey suggestions" for Studio Home: what to do next, derived only
 * from the summaries above. Each says why, what real observation it rests
 * on, the benefit, and whether acting on it needs approval. A suggestion
 * is never an approved task. Empty list = nothing to suggest.
 */
export function suggestNextSteps({ changes, health } = {}) {
  const steps = []
  if (changes?.checksFailed > 0) {
    steps.push({
      id: "failed-checks",
      title: `Selvitä ${changes.checksFailed} epäonnistunutta tarkistusta`,
      why: "Peliin viety muutos ei läpäissyt omaa automaattista tarkistustaan.",
      basis: `Muutoshistoriassa ${changes.checksFailed} muutosta tilassa “Check failed”.`,
      benefit: "Rikkinäinen muutos löytyy ennen kuin se haittaa pelaamista.",
      approval: "Tarkastelu ei vaadi hyväksyntää. Korjaus tai peruminen vaatii.",
      view: "qa",
    })
  }
  if (health && !health.healthy && health.failing.length) {
    steps.push({
      id: "health",
      title: "Korjaa Studion terveystarkistuksen huomiot",
      why: "Jokin Studion työkalu tai lähde ei ole kunnossa.",
      basis: `Terveystarkistus: ${health.failing.join(", ")}.`,
      benefit: "Esikatselu, tarkistukset ja Spacemonkey toimivat luotettavasti.",
      approval: "Tarkastelu ei vaadi hyväksyntää.",
      view: "qa",
    })
  }
  if (changes?.waitingPreviews > 0) {
    steps.push({
      id: "previews",
      title: `Käy läpi ${changes.waitingPreviews} viemätöntä esikatselua`,
      why: "Esikatseltuja muutoksia on jäänyt viemättä peliin tai hylkäämättä.",
      basis: `Muutoshistoriassa ${changes.waitingPreviews} muutosta tilassa “previewing”.`,
      benefit: "Keskeneräiset ideat eivät huku – jokainen joko peliin tai pois.",
      approval: "Tarkastelu ei vaadi hyväksyntää. Peliin vieminen vaatii.",
      view: "history",
    })
  }
  return steps
}
