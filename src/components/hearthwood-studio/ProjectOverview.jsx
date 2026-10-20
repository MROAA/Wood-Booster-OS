import { labelFor } from "./entityTypes"
import { summarizeContent, suggestNextSteps } from "./projectOverview"
import { t } from "./studioText"

// Studio Home - Project Overview and Spacemonkey suggestions, from the
// Studio's own sources (projectOverview.js). A source that cannot be read
// shows "not available", never a guess; old data is never shown as new
// (everything is read when Studio Home opens).

function ago(iso) {
  const time = Date.parse(iso || "")
  if (!Number.isFinite(time)) return ""
  const minutes = Math.round((Date.now() - time) / 60000)
  if (minutes < 1) return "juuri nyt"
  if (minutes < 60) return `${minutes} min sitten`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h sitten`
  return `${Math.round(hours / 24)} pv sitten`
}

function Stat({ label, source, testId, children }) {
  return (
    <div className="hws-stat" data-testid={testId}>
      <div className="hws-stat-label">{label}</div>
      <div className="hws-stat-body">{children}</div>
      <div className="hws-stat-source">{t("from", { source })}</div>
    </div>
  )
}

const Unavailable = () => <span className="text-[var(--wood-muted)]">{t("unavailable")}</span>
const Reading = () => <span className="text-[var(--wood-muted)]">{t("reading")}</span>

export function ProjectOverview({ overview, sources, onOpenView }) {
  const content = summarizeContent(overview, labelFor)
  const { loading, changes, health, monkey } = sources
  const n = value => value.toLocaleString("fi")

  return (
    <div className="hws-stats" data-testid="project-overview">
      <Stat label="Projekti" source="pelin data" testId="overview-content">
        <div className="hws-stat-value">Hearthwood</div>
        {overview === undefined ? <Reading /> : content ? (
          <div className="text-xs text-[var(--wood-muted)]">
            {n(content.total)} kohdetta {content.lists} listassa · eniten: {content.top.map(item => `${item.count} ${item.label}`).join(", ")}
          </div>
        ) : <Unavailable />}
      </Stat>

      <Stat label="Viimeisimmät muutokset" source="muutoshistoria" testId="overview-changes">
        {loading ? <Reading /> : changes ? (
          <>
            <div className="hws-stat-value">{n(changes.inGame)} <span className="text-sm font-normal text-[var(--wood-muted)]">pelissä</span></div>
            {changes.latest && <div className="truncate text-xs text-[var(--wood-muted)]" title={changes.latest.summary}>Viimeisin: {changes.latest.summary} · {ago(changes.latest.at)}</div>}
            {changes.waitingPreviews > 0 && <div className="text-xs text-[var(--wood-muted)]">{changes.waitingPreviews} keskeneräistä: esikatseltu, ei viety peliin</div>}
          </>
        ) : <Unavailable />}
      </Stat>

      <Stat label="Testitilanne" source="muutosten automaattinen tarkistus + Studion terveystarkistus" testId="overview-checks">
        {loading ? <Reading /> : changes || health ? (
          <>
            {changes && (
              <div className="hws-stat-value">
                {n(changes.checksPassed)} <span className="text-sm font-normal text-[var(--wood-muted)]">läpäisi</span>
                {changes.checksFailed > 0 && <span className="ml-2 text-sm text-[#d98a6c]">{changes.checksFailed} epäonnistui</span>}
                {changes.checksRunning > 0 && <span className="ml-2 text-sm text-[var(--wood-muted)]">{changes.checksRunning} käynnissä</span>}
              </div>
            )}
            {health && (
              <div className="text-xs text-[var(--wood-muted)]">
                Terveystarkistus: {health.healthy ? `kaikki ${health.checks} kunnossa` : `${health.failing.length} vaatii huomiota (${health.failing.join(", ")})`}
              </div>
            )}
            <button type="button" className="hws-link mt-1 text-xs" onClick={() => onOpenView("qa")} data-testid="overview-open-qa">Avaa Testaus ja QA</button>
          </>
        ) : <Unavailable />}
      </Stat>

      <Stat label="Spacemonkey" source="Dev Studion palvelu" testId="overview-spacemonkey">
        {loading ? <Reading /> : monkey ? (
          <>
            <div className="hws-stat-value">Valmiina</div>
            <div className="text-xs text-[var(--wood-muted)]">
              {monkey.automaticExecution ? "Voi ajaa työkaluja itsenäisesti" : "Vain ehdottaa – ei koskaan muuta tiedostoja itse"}
            </div>
          </>
        ) : <Unavailable />}
      </Stat>
    </div>
  )
}

export function SpacemonkeySuggestions({ sources, onOpenView }) {
  if (sources.loading) return <Reading />
  const steps = suggestNextSteps(sources)
  return (
    <div data-testid="spacemonkey-suggestions">
      <p className="mb-2 text-xs text-[var(--wood-muted)]">{t("suggestionsNote")}</p>
      {!steps.length ? (
        <p className="text-sm text-[var(--wood-muted)]" data-testid="suggestions-none">{t("suggestionsNone")}</p>
      ) : (
        <ul className="hws-suggestions">
          {steps.map(step => (
            <li key={step.id} className="hws-suggestion" data-testid={`suggestion-${step.id}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--wood-text)]">{step.title}</span>
                <button type="button" className="hws-button shrink-0" onClick={() => onOpenView(step.view)}>Avaa</button>
              </div>
              <dl className="hws-suggestion-facts">
                <dt>{t("suggestionWhy")}</dt><dd>{step.why}</dd>
                <dt>{t("suggestionBasis")}</dt><dd>{step.basis}</dd>
                <dt>{t("suggestionBenefit")}</dt><dd>{step.benefit}</dd>
                <dt>{t("suggestionApproval")}</dt><dd>{step.approval}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ProjectOverview
