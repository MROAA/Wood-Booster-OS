import { useCallback, useEffect, useRef, useState } from "react"

const API_BASE = "http://localhost:3001/api"

const PHASES = [
  "Phase 0 - Concept",
  "Phase 1 - Prototype",
  "Phase 2 - Vertical Slice",
  "Phase 3 - MVP",
  "Phase 4 - Content",
  "Phase 5 - Polish",
  "Phase 6 - Release",
]

const STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "ready", label: "Valmis aloitettavaksi" },
  { value: "in_progress", label: "Työn alla" },
  { value: "blocked", label: "Jumissa" },
  { value: "review", label: "Katselmoinnissa" },
  { value: "testing", label: "Testauksessa" },
  { value: "done", label: "Valmis" },
]

const PRIORITIES = ["high", "medium", "low"]
const COMPLEXITIES = ["S", "M", "L", "XL", "XXL"]

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) throw new Error(`GET ${path} epäonnistui`)
  return response.json()
}

async function apiSend(path, method, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `${method} ${path} epäonnistui`)
  }
  return response.status === 204 ? null : response.json()
}

function StatCounter({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--wood-border)] px-4 py-3 min-w-[110px]">
      <div className="text-2xl font-semibold text-[var(--wood-text)]">{value}</div>
      <div className="text-xs text-[var(--wood-muted)]">{label}</div>
    </div>
  )
}

function DailyBrief({ brief, nextAction, onAskWhatNext }) {
  return (
    <section className="panel p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--wood-text)]">
            Päivän tilanne
          </h2>
          <p className="text-sm text-[var(--wood-muted)]">
            {brief?.activePhase
              ? `Aktiivinen vaihe: ${brief.activePhase}`
              : "Ei vielä tehtäviä roadmapilla."}
          </p>
        </div>
        <button className="wb-button" onClick={onAskWhatNext}>
          Mitä teen seuraavaksi?
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {STATUSES.map((status) => (
          <StatCounter
            key={status.value}
            label={status.label}
            value={brief?.counts?.[status.value] ?? 0}
          />
        ))}
      </div>

      {nextAction && (
        <div className="rounded-xl border border-[var(--wood-accent)]/40 bg-[var(--wood-accent)]/5 p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--wood-accent)] mb-1">
            Suositeltu seuraava tehtävä
          </div>
          <div className="text-[var(--wood-text)] font-medium">{nextAction.title}</div>
          {nextAction.description && (
            <p className="text-sm text-[var(--wood-muted)] mt-1">
              {nextAction.description}
            </p>
          )}
        </div>
      )}

      {brief?.blocked?.length > 0 && (
        <div className="text-sm text-amber-400">
          ⚠ {brief.blocked.length} tehtävä(ä) jumissa - katso Roadmap-välilehti.
        </div>
      )}
    </section>
  )
}

function ChatTab() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hei! Olen Heartwood Project Assistant. Kerro mitä haluaisit " +
        "Heartwoodiin, tai kysy mitä teen seuraavaksi - selitän kaiken " +
        "ilman että sinun tarvitsee tuntea pelikehitystä ennalta.",
    },
  ])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, isThinking])

  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed || isThinking) return

    const conversation = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setInput("")
    setIsThinking(true)

    try {
      const response = await fetch(`${API_BASE}/agents/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `/heartwood ${trimmed}`,
          conversation,
        }),
      })
      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "Ei vastausta juuri nyt.",
          error: !data.success,
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Yhteysvirhe: ${error.message}. Onko palvelin käynnissä?`,
          error: true,
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <section className="panel p-0 flex flex-col h-[560px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <div
              className={
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap " +
                (message.role === "user"
                  ? "bg-[var(--wood-accent)] text-black"
                  : message.error
                    ? "bg-red-950/40 border border-red-800 text-red-300"
                    : "bg-[var(--wood-panel)] border border-[var(--wood-border)] text-[var(--wood-text)]")
              }
            >
              {message.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 text-sm border border-[var(--wood-border)] text-[var(--wood-muted)]">
              Mietin...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage(input)
        }}
        className="border-t border-[var(--wood-border)] p-4 flex gap-3"
      >
        <input
          className="wb-input flex-1"
          placeholder="Kirjoita vapaasti, esim. 'Haluan bossin joka muuttaa taistelukentän'"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="wb-button" type="submit" disabled={isThinking}>
          Lähetä
        </button>
      </form>
    </section>
  )
}

function TaskForm({ onCreate }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    phase: PHASES[0],
    status: "backlog",
    priority: "medium",
    complexity: "M",
    dependencies: "",
    acceptanceCriteria: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) return

    setIsSaving(true)
    try {
      await onCreate(form)
      setForm({
        title: "",
        description: "",
        phase: form.phase,
        status: "backlog",
        priority: "medium",
        complexity: "M",
        dependencies: "",
        acceptanceCriteria: "",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-5 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--wood-text)]">
        Uusi tehtävä
      </h3>
      <input
        className="wb-input"
        placeholder="Otsikko, esim. 'Poison-mekaniikka'"
        value={form.title}
        onChange={(event) => update("title", event.target.value)}
      />
      <textarea
        className="wb-input"
        rows={2}
        placeholder="Kuvaus (vapaaehtoinen)"
        value={form.description}
        onChange={(event) => update("description", event.target.value)}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select
          className="wb-input"
          value={form.phase}
          onChange={(event) => update("phase", event.target.value)}
        >
          {PHASES.map((phase) => (
            <option key={phase} value={phase}>
              {phase}
            </option>
          ))}
        </select>
        <select
          className="wb-input"
          value={form.status}
          onChange={(event) => update("status", event.target.value)}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          className="wb-input"
          value={form.priority}
          onChange={(event) => update("priority", event.target.value)}
        >
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <select
          className="wb-input"
          value={form.complexity}
          onChange={(event) => update("complexity", event.target.value)}
        >
          {COMPLEXITIES.map((complexity) => (
            <option key={complexity} value={complexity}>
              {complexity}
            </option>
          ))}
        </select>
      </div>
      <input
        className="wb-input"
        placeholder="Riippuvuudet (vapaa teksti, esim. 'Combat Event System')"
        value={form.dependencies}
        onChange={(event) => update("dependencies", event.target.value)}
      />
      <textarea
        className="wb-input"
        rows={2}
        placeholder="Hyväksymiskriteerit (vapaaehtoinen)"
        value={form.acceptanceCriteria}
        onChange={(event) => update("acceptanceCriteria", event.target.value)}
      />
      <button className="wb-button" type="submit" disabled={isSaving}>
        {isSaving ? "Tallennetaan..." : "Lisää tehtävä"}
      </button>
    </form>
  )
}

function TaskCard({ task, onUpdateStatus, onDelete }) {
  return (
    <div className="rounded-xl border border-[var(--wood-border)] p-3 space-y-2 bg-[var(--wood-panel)]">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-sm text-[var(--wood-text)]">
          {task.title}
        </div>
        <button
          className="text-xs text-[var(--wood-muted)] hover:text-red-400"
          onClick={() => onDelete(task.id)}
          title="Poista"
        >
          ✕
        </button>
      </div>
      {task.description && (
        <p className="text-xs text-[var(--wood-muted)]">{task.description}</p>
      )}
      <div className="flex flex-wrap gap-2 text-xs text-[var(--wood-muted)]">
        <span>prio: {task.priority}</span>
        <span>koko: {task.complexity}</span>
        <span>{task.phase}</span>
      </div>
      {task.dependencies && (
        <div className="text-xs text-[var(--wood-muted)]">
          riippuu: {task.dependencies}
        </div>
      )}
      <select
        className="wb-input text-xs py-1"
        value={task.status}
        onChange={(event) => onUpdateStatus(task.id, event.target.value)}
      >
        {STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function RoadmapTab({ tasks, onRefresh }) {
  async function handleCreate(form) {
    await apiSend("/heartwood/tasks", "POST", form)
    onRefresh()
  }

  async function handleUpdateStatus(id, status) {
    await apiSend(`/heartwood/tasks/${id}`, "PATCH", { status })
    onRefresh()
  }

  async function handleDelete(id) {
    await apiSend(`/heartwood/tasks/${id}`, "DELETE")
    onRefresh()
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
      <TaskForm onCreate={handleCreate} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STATUSES.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status.value)
          return (
            <div key={status.value} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
                {status.label} ({columnTasks.length})
              </h3>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                  />
                ))}
                {columnTasks.length === 0 && (
                  <p className="text-xs text-[var(--wood-muted)] italic">Tyhjä</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DecisionForm({ onCreate }) {
  const [form, setForm] = useState({
    title: "",
    decision: "",
    reason: "",
    affectedAreas: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.decision.trim()) return

    setIsSaving(true)
    try {
      await onCreate(form)
      setForm({ title: "", decision: "", reason: "", affectedAreas: "" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-5 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--wood-text)]">
        Uusi päätös
      </h3>
      <input
        className="wb-input"
        placeholder="Otsikko, esim. 'Combat on autobattler'"
        value={form.title}
        onChange={(event) => update("title", event.target.value)}
      />
      <textarea
        className="wb-input"
        rows={2}
        placeholder="Mitä päätettiin?"
        value={form.decision}
        onChange={(event) => update("decision", event.target.value)}
      />
      <textarea
        className="wb-input"
        rows={2}
        placeholder="Miksi (vapaaehtoinen)"
        value={form.reason}
        onChange={(event) => update("reason", event.target.value)}
      />
      <input
        className="wb-input"
        placeholder="Mihin vaikuttaa (vapaaehtoinen, esim. 'Combat, UI')"
        value={form.affectedAreas}
        onChange={(event) => update("affectedAreas", event.target.value)}
      />
      <button className="wb-button" type="submit" disabled={isSaving}>
        {isSaving ? "Tallennetaan..." : "Kirjaa päätös"}
      </button>
    </form>
  )
}

function DecisionsTab({ decisions, onRefresh }) {
  async function handleCreate(form) {
    await apiSend("/heartwood/decisions", "POST", form)
    onRefresh()
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
      <DecisionForm onCreate={handleCreate} />

      <div className="space-y-3">
        {decisions.map((decision) => (
          <div key={decision.id} className="panel p-4 space-y-1">
            <div className="text-xs text-[var(--wood-accent)]">
              DEC-{String(decision.id).padStart(3, "0")} · {decision.status}
            </div>
            <div className="font-medium text-[var(--wood-text)]">
              {decision.title}
            </div>
            <p className="text-sm text-[var(--wood-muted)]">{decision.decision}</p>
            {decision.reason && (
              <p className="text-xs text-[var(--wood-muted)]">
                Miksi: {decision.reason}
              </p>
            )}
            {decision.affectedAreas && (
              <p className="text-xs text-[var(--wood-muted)]">
                Vaikuttaa: {decision.affectedAreas}
              </p>
            )}
          </div>
        ))}
        {decisions.length === 0 && (
          <p className="text-sm text-[var(--wood-muted)] italic">
            Ei vielä kirjattuja päätöksiä.
          </p>
        )}
      </div>
    </div>
  )
}

function HeartwoodAssistant() {
  const [activeTab, setActiveTab] = useState("chat")
  const [tasks, setTasks] = useState([])
  const [decisions, setDecisions] = useState([])
  const [brief, setBrief] = useState(null)
  const [nextAction, setNextAction] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [taskList, decisionList, briefData] = await Promise.all([
        apiGet("/heartwood/tasks"),
        apiGet("/heartwood/decisions"),
        apiGet("/heartwood/brief"),
      ])
      setTasks(taskList)
      setDecisions(decisionList)
      setBrief(briefData)
      setLoadError(null)
    } catch (error) {
      setLoadError(error.message)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleAskWhatNext() {
    try {
      const data = await apiGet("/heartwood/next-action")
      setNextAction(data.next)
    } catch (error) {
      setLoadError(error.message)
    }
  }

  const tabs = [
    { id: "chat", label: "Keskustelu" },
    { id: "roadmap", label: "Roadmap & Tehtävät" },
    { id: "decisions", label: "Päätösloki" },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">🧭 Heartwood Project Assistant</h1>
        <p className="page-description">
          AI-projektipäällikkösi Heartwood-pelille. Kysy, ehdota ideoita ja
          seuraa mitä on tehty ja mitä on vielä edessä.
        </p>
      </header>

      {loadError && (
        <div className="panel text-red-400 p-4 text-sm">
          Yhteysvirhe: {loadError}. Onko backend (npm start / port 3001)
          käynnissä?
        </div>
      )}

      <DailyBrief brief={brief} nextAction={nextAction} onAskWhatNext={handleAskWhatNext} />

      <div className="flex gap-2 border-b border-[var(--wood-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px " +
              (activeTab === tab.id
                ? "border-[var(--wood-accent)] text-[var(--wood-text)]"
                : "border-transparent text-[var(--wood-muted)] hover:text-[var(--wood-text)]")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "chat" && <ChatTab />}
      {activeTab === "roadmap" && <RoadmapTab tasks={tasks} onRefresh={refresh} />}
      {activeTab === "decisions" && (
        <DecisionsTab decisions={decisions} onRefresh={refresh} />
      )}
    </div>
  )
}

export default HeartwoodAssistant
