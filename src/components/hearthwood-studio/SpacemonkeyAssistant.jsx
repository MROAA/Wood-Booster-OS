
import { useRef, useState } from "react"

import { API_URL } from "../../api/client"
import spacemonkeyAvatar from "../../assets/branding/Spacemonkey.png"

// Same backend as the rest of the Studio (Sprint 4: it pointed at port
// 3002, where nothing listens, so the assistant never answered).
const API_BASE =
  import.meta.env.VITE_HEARTHWOOD_DEV_API_URL ||
  API_URL

// The 14B planning model answers in about 10-60 s, a retry doubles it.
const REQUEST_TIMEOUT_MS = 180000

const INITIAL_MESSAGE = {
  id: 1,
  role: "assistant",
  content:
    "Hei! Olen Spacemonkey, Hearthwoodin kehitysavustaja. " +
    "Kerro omin sanoin, mitä haluat tutkia tai kehittää – valitsen sopivan työkalun itse. " +
    "Ehdotan muutoksia, mutta en muuta pelin tiedostoja ilman hyväksyntääsi.",
}

function inlineMarkdown(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, index) => {
      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        )
      }

      if (
        part.startsWith("`") &&
        part.endsWith("`")
      ) {
        return (
          <code
            key={index}
            className="rounded bg-[var(--wood-panel)] px-1 font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        )
      }

      return part
    })
}

function MessageContent({ content }) {
  const lines = String(content || "")
    .replace(/&#x0*20;|&nbsp;/gi, " ")
    .replace(/\\\*\\\*/g, "**")
    .split("\n")

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={index} className="h-2" />
        }

        const heading = trimmed.match(/^#{1,3}\s+(.+)/)

        if (heading) {
          return (
            <p key={index} className="pt-2 font-bold">
              {inlineMarkdown(heading[1])}
            </p>
          )
        }

        const bullet = trimmed.match(
          /^(?:[-*•]|\d+[.)])\s*(.+)/,
        )

        if (bullet) {
          return (
            <p key={index} className="pl-3">
              <span className="mr-2 text-[var(--wood-accent)]">
                •
              </span>
              {inlineMarkdown(bullet[1])}
            </p>
          )
        }

        return (
          <p key={index}>
            {inlineMarkdown(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

async function postJson(endpoint, body) {
  let response

  try {
    response = await fetch(
      `${API_BASE}/hearthwood-dev/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    )
  } catch (error) {
    if (
      error.name === "TimeoutError" ||
      error.name === "AbortError"
    ) {
      throw new Error(
        "Spacemonkeyn pyyntö aikakatkaistiin.",
      )
    }

    throw new Error(
      "Yhteys Spacemonkey-palvelimeen epäonnistui. " +
      "Tarkista, että Studion backend on käynnissä.",
    )
  }

  let result

  try {
    result = await response.json()
  } catch {
    throw new Error(
      "Palvelin palautti virheellisen vastauksen.",
    )
  }

  if (!response.ok || !result?.success) {
    const failure = new Error(
      result?.error ||
      "Spacemonkey ei pystynyt suorittamaan tehtävää.",
    )
    // The gates' verdict travels with the error so the panel can say
    // "blocked by a safety check" instead of a generic failure.
    failure.status = response.status
    failure.body = result
    throw failure
  }

  return result
}

function CodeExcerpt({ title, filePath, content, partial }) {
  return (
    <div className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-3">
      <p className="font-bold text-[var(--wood-accent)]">
        {title}
      </p>

      <p className="break-all font-mono text-xs text-[var(--wood-muted)]">
        {filePath}
      </p>

      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--wood-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--wood-text)]">
        <code>{content || "Lähdekoodikatkelma puuttuu."}</code>
      </pre>

      {partial && (
        <p className="text-xs text-[var(--wood-muted)]">
          Katkelma on osittainen.
        </p>
      )}
    </div>
  )
}

function SourceDetails({ analysis }) {
  if (!analysis) return null

  const verified = analysis.verifiedSources || []
  const dependencies = analysis.dependencySources || []
  const unresolved = analysis.unresolvedDependencies || []
  const inspected = analysis.inspectedFiles || []

  return (
    <details className="mt-3 rounded-xl border border-[var(--wood-border)] p-3 text-xs">
      <summary className="cursor-pointer font-semibold text-[var(--wood-accent)]">
        Näytä lähdekoodin tarkistustiedot
      </summary>

      <div className="mt-3 space-y-4">
        <p className="text-[var(--wood-muted)]">
          Lähdekoodikatkelmat ovat suoraan Hearthwoodin
          tiedostoista. Spacemonkeyn sanallinen tulkinta
          ei ole automaattisesti täysin varmennettu.
        </p>

        {verified.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-bold text-[var(--wood-text)]">
              Todennetut funktiot ({verified.length})
            </h3>

            {verified.map((item, index) => (
              <CodeExcerpt
                key={`${item.filePath}-${item.symbol}-${index}`}
                title={item.symbol}
                filePath={item.filePath}
                content={item.source}
                partial={item.truncated}
              />
            ))}
          </section>
        )}

        {dependencies.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-bold text-[var(--wood-text)]">
              Todennetut riippuvuudet ({dependencies.length})
            </h3>

            {dependencies.map((item, index) => (
              <CodeExcerpt
                key={`${item.filePath}-${item.symbol}-${index}`}
                title={item.symbol}
                filePath={item.filePath}
                content={item.excerpt}
                partial={item.partial}
              />
            ))}
          </section>
        )}

        {unresolved.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-bold text-[var(--wood-text)]">
              Selvittämättömät riippuvuudet
            </h3>

            {unresolved.map((item, index) => (
              <p
                key={index}
                className="break-words text-[var(--wood-muted)]"
              >
                {item.symbol} — {item.reason}
              </p>
            ))}
          </section>
        )}

        {inspected.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-bold text-[var(--wood-text)]">
              Tutkitut tiedostot
            </h3>

            {inspected.map((item, index) => (
              <p
                key={index}
                className="break-all font-mono text-xs text-[var(--wood-muted)]"
              >
                {item.filePath}
                {item.truncated ? " (osittainen)" : ""}
              </p>
            ))}
          </section>
        )}

        {analysis.warning && (
          <p className="border-t border-[var(--wood-border)] pt-3 text-[var(--wood-muted)]">
            {analysis.warning}
          </p>
        )}
      </div>
    </details>
  )
}

// --- Task stages the backend can actually confirm (PRD §11.6) ----------
// "Toteutetaan" / "Testataan" are never shown: the Studio has no approved
// apply step for Spacemonkey's plans yet, so claiming them would be false.
const STAGES = {
  routing: { label: "Valitaan työkalua", tone: "busy" },
  analyzing: { label: "Analysoidaan", tone: "busy" },
  planning: { label: "Suunnitellaan", tone: "busy" },
  review: { label: "Odottaa tarkistusta", tone: "wait" },
  approval: { label: "Odottaa hyväksyntää", tone: "wait" },
  done: { label: "Valmis", tone: "ok" },
  blocked: { label: "Estetty turvallisuustarkistuksessa", tone: "stop" },
  error: { label: "Virhe", tone: "stop" },
}

const DECISION_LABELS = {
  NO_CHANGE_NEEDED: "Ei muutostarvetta (ehdotus)",
  INSUFFICIENT_EVIDENCE: "Tietoa ei ole tarpeeksi",
  CHANGE_REQUIRED: "Muutos tarvitaan (ehdotus)",
}

const CHECK_STATUS = {
  verified: "✓", "verified-in-scope": "✓", "model-claimed": "AI:n oma kuvaus", incomplete: "puutteellinen",
  failed: "✗", missing: "puuttuu", warning: "huomio", "not-checked": "ei tarkistettu",
  "not-verifiable-here": "ei todennettavissa tässä",
}

function contextLine(context) {
  if (!context) return ""
  const parts = [`avoin editori: ${context.editorLabel}`]
  if (context.type && context.id) parts.push(`valittu kohde: ${context.entityName || context.id} (${context.type}/${context.id})`)
  else if (context.type) parts.push(`lista: ${context.type}`)
  return `\n\n[Studion konteksti – ${parts.join(", ")}]`
}

function StageBadge({ stage }) {
  if (!stage) return null
  const info = STAGES[stage]
  return (
    <span className={`hws-stage is-${info.tone}`} data-testid="assistant-stage" data-stage={stage}>
      {info.tone === "busy" && <span className="hws-stage-dot" aria-hidden="true" />}
      {info.label}
    </span>
  )
}

function PlanResult({ plan }) {
  if (!plan) return null
  const quality = plan.planQuality
  const report = plan.evidenceReport
  const decision = plan.proposedDecision || (plan.status === "plan_ready" ? "CHANGE_REQUIRED" : null)
  const impact = quality?.dependencyImpact
  return (
    <div className="hws-plan" data-testid="assistant-plan">
      <div className="hws-plan-banner">
        {decision ? DECISION_LABELS[decision] : "Tulos"} · <strong>ei toteutettu</strong>
        {plan.executionApproved === false && " · ei hyväksytty"}
      </div>

      {quality?.requiredChanges?.length > 0 && (
        <section>
          <h4>Muutettavat tiedostot</h4>
          <ul>
            {quality.requiredChanges.map(file => (
              <li key={file.filePath}>
                <code>{file.filePath}</code>
                <span className="block text-[var(--wood-muted)]">{file.reason}</span>
                {file.symbols?.length > 0 && <span className="block text-[11px] text-[var(--wood-muted)]">lähdesymbolit: {file.symbols.join(", ")}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {impact?.symbols?.length > 0 && (
        <section>
          <h4>Riippuvuudet (todennettu {impact.scope.filesScanned} tiedostosta)</h4>
          <ul>
            {impact.symbols.map(item => (
              <li key={`${item.filePath}-${item.symbol}`}>
                <code>{item.symbol}</code> – {item.callSites.length} kutsukohtaa
                {item.affectedFiles.length > 0 && ` (${item.affectedFiles.length} muussa tiedostossa)`}
                {item.interfaceRisk && <span className="ml-1 text-[#d9b06c]">· julkinen rajapinta</span>}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[var(--wood-muted)]">{impact.scope.limits}</p>
        </section>
      )}

      {impact?.missingRegressionTests?.length > 0 && (
        <section>
          <h4>Testitarpeet</h4>
          <ul>{impact.missingRegressionTests.map(item => <li key={item}>Ei olemassa olevaa testiä: <code>{item}</code></li>)}</ul>
        </section>
      )}

      {quality?.followUps?.length > 0 && (
        <section>
          <h4>Jatkoideat (eivät kuulu muutokseen)</h4>
          <ul>{quality.followUps.map(item => <li key={item}>{item}</li>)}</ul>
        </section>
      )}

      {report?.unknown?.length > 0 && (
        <details>
          <summary>Mitä ei tutkittu kokonaan ({report.unknown.length})</summary>
          <ul>{report.unknown.map(item => <li key={item}>{item}</li>)}</ul>
        </details>
      )}

      {quality?.checks?.length > 0 && (
        <details>
          <summary>Tarkistukset</summary>
          <ul>
            {quality.checks.map(check => (
              <li key={check.id}><strong>{check.id}</strong>: {CHECK_STATUS[check.status] || check.status} – {check.detail}</li>
            ))}
          </ul>
        </details>
      )}

      {plan.status === "plan_ready" && (
        <p className="hws-plan-approval">
          Toteutus vaatii hyväksynnän. Spacemonkeyn suunnitelmia ei vielä voi viedä peliin Studiosta – mikään tiedosto ei ole muuttunut.
        </p>
      )}
    </div>
  )
}

function BlockedDetails({ body }) {
  if (!body) return null
  const gate = body.safety || body.sourceTruth || body.reliability
  const codes = (gate?.issues || []).map(issue => issue.code).filter(Boolean)
  if (!codes.length) return null
  return (
    <details className="mt-2 text-xs text-[var(--wood-muted)]">
      <summary className="cursor-pointer">Tekniset tiedot</summary>
      <p className="mt-1">Tarkistus: {body.safety ? "Safety Supervisor" : body.sourceTruth ? "SourceTruthGuard" : "Reliability Gate"} · {codes.join(", ")}</p>
    </details>
  )
}

export default function SpacemonkeyAssistant({ context = null }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [stage, setStage] = useState(null)
  const [attachContext, setAttachContext] = useState(true)

  const nextId = useRef(2)
  const busy = useRef(false)
  const working = Boolean(stage && STAGES[stage].tone === "busy")

  function addMessage(role, content, extra = {}) {
    setMessages(previous => [...previous, { id: nextId.current++, role, content, ...extra }])
  }

  async function send(event) {
    event?.preventDefault()
    const text = input.trim()
    if (!text || busy.current) return

    busy.current = true
    setInput("")
    const extra = attachContext && context ? contextLine(context) : ""
    addMessage("user", text, extra ? { contextNote: extra.trim() } : {})

    try {
      setStage("routing")
      // Routing sees only the user's own words: the attached context must
      // not change which tool is picked.
      const route = await postJson("route", { prompt: text })

      if (route.requiresApproval) {
        setStage("approval")
        addMessage("assistant", "Tämä tehtävä vaatii hyväksynnän. Mitään muutoksia ei tehty.")
        return
      }

      if (!route.matched || !route.apiReady) {
        setStage("done")
        addMessage("assistant", "En löytänyt tähän tehtävään vielä käytettävissä olevaa työkalua. Pelin tiedostoja ei muutettu.")
        return
      }

      const skill = route.skill?.id

      if (skill === "code-analysis") {
        setStage("analyzing")
        const result = await postJson("analyze", { prompt: text + extra })
        setStage("done")
        addMessage("assistant", result.answer || "Analyysia ei voitu muodostaa.", { analysis: result })
        return
      }

      if (skill === "change-planning") {
        setStage("planning")
        const result = await postJson("plan", { prompt: text + extra })
        setStage(result.status === "plan_ready" ? "approval" : "review")
        addMessage("assistant", result.explanation || "Spacemonkey palautti tuloksen ilman selitystä.", { plan: result })
        return
      }

      setStage("done")
      addMessage("assistant", "Tunnistin tehtävän, mutta tätä työkalua ei ole vielä yhdistetty Studioon. Pelin tiedostoja ei muutettu.")
    } catch (error) {
      const blocked = error.status === 422 && (error.body?.safety || error.body?.sourceTruth || error.body?.reliability)
      setStage(blocked ? "blocked" : "error")
      addMessage(
        "assistant",
        blocked
          ? `${error.message} Vastausta ei näytetä, koska sen lähteitä ei voitu todentaa. Pelin tiedostoja ei muutettu.`
          : `${error.message} Pelin tiedostoja ei muutettu.`,
        { error: true, blockedBody: blocked ? error.body : null },
      )
    } finally {
      busy.current = false
    }
  }

  return (
    <section className="hws-assistant" data-testid="spacemonkey-assistant" aria-label="Spacemonkey">
      <header className="hws-assistant-head">
        <img src={spacemonkeyAvatar} alt="" className={`hws-avatar ${working ? "is-thinking" : ""}`} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[var(--wood-text)]">Spacemonkey</h2>
          <p className="text-xs text-[var(--wood-muted)]">Hearthwoodin älykäs avustaja</p>
        </div>
        <StageBadge stage={stage} />
      </header>

      <div className="hws-assistant-log" aria-live="polite" data-testid="assistant-log">
        {messages.map(message => (
          <div key={message.id} className={`hws-msg ${message.role === "user" ? "is-user" : ""}`}>
            <p className="hws-msg-who">{message.role === "user" ? "Sinä" : "Spacemonkey"}</p>
            <div className={message.error ? "text-[#f0b39c]" : "text-[var(--wood-text)]"}>
              <MessageContent content={message.content} />
            </div>
            {message.contextNote && <p className="mt-1 text-[11px] text-[var(--wood-muted)]">{message.contextNote}</p>}
            <PlanResult plan={message.plan} />
            <BlockedDetails body={message.blockedBody} />
            <SourceDetails analysis={message.analysis} />
          </div>
        ))}
        {working && <p className="text-sm text-[var(--wood-muted)]">{STAGES[stage].label}… 14B-mallilla tämä kestää yleensä 10–60 sekuntia.</p>}
      </div>

      <form onSubmit={send} className="hws-assistant-input">
        {context && (
          <label className="hws-context" data-testid="assistant-context">
            <input type="checkbox" checked={attachContext} onChange={event => setAttachContext(event.target.checked)} />
            <span>
              Liitä avoin editori: <strong>{context.editorLabel}</strong>
              {context.entityName && <> › <strong>{context.entityName}</strong></>}
            </span>
          </label>
        )}
        <textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              send()
            }
          }}
          rows={3}
          placeholder="Kirjoita tehtävä omin sanoin, esim. “Tutki, miten Guardianin Intercept toimii”"
          className="w-full resize-none rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] p-2 text-sm text-[var(--wood-text)] placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)] focus:outline-none"
          data-testid="assistant-input"
        />
        <button type="submit" disabled={working || !input.trim()} className="hws-button self-end disabled:opacity-50" data-testid="assistant-send">
          Lähetä
        </button>
      </form>
    </section>
  )
}
