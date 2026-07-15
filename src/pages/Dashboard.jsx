import { useEffect, useState } from "react"
import { Link } from "react-router"

import StatCard from "../components/dashboard/StatCard"

const DASHBOARD_API =
  "http://localhost:3001/api/dashboard"

function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(DASHBOARD_API)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Dashboardin lataaminen epäonnistui",
          )
        }

        setDashboard(data)
      } catch (loadError) {
        console.error(loadError)
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 p-10 text-white">
        Ladataan Dashboardia...
      </main>
    )
  }

  if (!dashboard) {
    return (
      <main className="min-h-screen bg-neutral-950 p-10 text-white">
        <h1 className="text-3xl font-bold">
          Dashboardia ei voitu ladata
        </h1>

        <p className="mt-4 text-red-400">
          {error || "Tuntematon virhe"}
        </p>
      </main>
    )
  }

  const summary = dashboard.summary || {}
  const projects = Array.isArray(dashboard.projects)
    ? dashboard.projects
    : []
  const recentProjects = Array.isArray(
    dashboard.recentProjects,
  )
    ? dashboard.recentProjects
    : []
  const upcomingDeadlines = Array.isArray(
    dashboard.upcomingDeadlines,
  )
    ? dashboard.upcomingDeadlines
    : []
  const overdueProjects = Array.isArray(
    dashboard.overdueProjects,
  )
    ? dashboard.overdueProjects
    : []

  const totalFileCount = projects.reduce(
    (sum, project) =>
      sum +
      (Array.isArray(project.files)
        ? project.files.length
        : 0),
    0,
  )

  return (
    <div>
      <section className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
          Wood-Booster Command Center
        </p>

        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Mitä rakennamme tänään?
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-neutral-400">
          Yrityksen projektit, asiakkaat,
          kustannukset ja tuotannon eteneminen
          yhdessä näkymässä.
        </p>
      </section>

      {error && (
        <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-red-300">
          {error}
        </div>
      )}

      <section className="mt-8">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Quick actions
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Avaa työtila
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionCard
            to="/projects"
            icon="📦"
            title="Projektit"
            description={`${toNumber(
              summary.projectCount,
            )} projektia tietokannassa.`}
          />

          <QuickActionCard
            to="/customers"
            icon="👥"
            title="Asiakkaat"
            description={`${toNumber(
              summary.customerCount,
            )} asiakasta rekisterissä.`}
            highlight
          />

          <QuickActionCard
            to="/inventory"
            icon="🧰"
            title="Varasto"
            description="Hallitse materiaaleja ja hankintoja."
          />

          <QuickActionCard
            to="/agents"
            icon="🤖"
            title="AI Agents"
            description="Avaa Wood-Boosterin AI-avustajat."
          />
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="📦"
          label="Aktiiviset projektit"
          value={toNumber(
            summary.activeProjectCount,
          )}
          detail={`${toNumber(
            summary.completedProjectCount,
          )} valmista`}
        />

        <StatCard
          icon="👥"
          label="Asiakkaat"
          value={toNumber(summary.customerCount)}
          detail="Asiakasrekisterissä"
        />

        <StatCard
          icon="🪵"
          label="Materiaalikulut"
          value={formatCurrency(
            summary.totalMaterialCosts,
          )}
          detail="Kaikki projektit"
        />

        <StatCard
          icon="💰"
          label="Arvioitu myynti"
          value={formatCurrency(
            summary.estimatedRevenue,
          )}
          detail="Suositushintojen summa"
          highlight
        />
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Tuotantokustannukset"
          value={formatCurrency(
            summary.totalProductionCosts,
          )}
          description="Materiaalit, työ ja muut kulut"
        />

        <SummaryCard
          label="Arvioitu kate"
          value={formatCurrency(
            summary.estimatedProfit,
          )}
          description="Myyntiarvo vähennettynä kustannuksilla"
          highlight
        />

        <SummaryCard
          label="Työtunnit"
          value={`${formatNumber(
            summary.totalLaborHours,
          )} h`}
          description="Kaikki projektit yhteensä"
        />

        <SummaryCard
          label="Projektitiedostot"
          value={totalFileCount}
          description="Kuvat, PDF:t ja muut tiedostot"
        />
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Recent projects
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Viimeisimmät projektit
              </h2>
            </div>

            <Link
              to="/projects"
              className="text-sm text-amber-400 transition hover:text-amber-300"
            >
              Näytä kaikki →
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <EmptyBox
              icon="🪵"
              title="Ei projekteja vielä"
              description="Luo ensimmäinen projekti Projektit-sivulla."
            />
          ) : (
            <div className="mt-6 space-y-4">
              {recentProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Deadlines
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Tulevat määräajat
          </h2>

          {upcomingDeadlines.length === 0 ? (
            <EmptyBox
              icon="📅"
              title="Ei tulevia deadlineja"
              description="Aseta deadline projektin Yleiskatsaus-välilehdellä."
            />
          ) : (
            <div className="mt-6 space-y-3">
              {upcomingDeadlines.map((project) => (
                <DeadlineRow
                  key={project.id}
                  project={project}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {overdueProjects.length > 0 && (
        <section className="mt-8 rounded-2xl border border-red-900/40 bg-red-950/10 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-red-400">
                Attention
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Myöhässä olevat projektit
              </h2>
            </div>

            <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400">
              {overdueProjects.length}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {overdueProjects.map((project) => (
              <DeadlineRow
                key={project.id}
                project={project}
                overdue
              />
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Production progress
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Projektien eteneminen
          </h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {projects.slice(0, 6).map((project) => (
              <ProgressCard
                key={project.id}
                project={project}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function QuickActionCard({
  to,
  icon,
  title,
  description,
  highlight = false,
}) {
  return (
    <Link
      to={to}
      className={`group rounded-2xl border p-5 transition ${
        highlight
          ? "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10"
          : "border-neutral-800 bg-neutral-900 hover:border-amber-500/40 hover:bg-neutral-800"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-3xl">{icon}</span>
        <span className="text-neutral-600 transition group-hover:text-amber-400">
          →
        </span>
      </div>

      <h3 className="mt-5 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-neutral-400">
        {description}
      </p>
    </Link>
  )
}

function SummaryCard({
  label,
  value,
  description,
  highlight = false,
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <p className="text-sm text-neutral-500">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${
          highlight
            ? "text-amber-400"
            : "text-neutral-100"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-neutral-500">
        {description}
      </p>
    </div>
  )
}

function ProjectRow({ project }) {
  const progress =
    calculateWorkflowProgress(project)

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-xl border border-neutral-800 bg-neutral-950 p-4 transition hover:border-amber-500/50 hover:bg-neutral-900"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="truncate font-semibold text-neutral-100">
              {project.name}
            </h3>

            <StatusBadge
              status={
                project.status || "Suunnittelu"
              }
            />
          </div>

          <p className="mt-2 text-sm text-neutral-500">
            Asiakas:{" "}
            {project.customer?.name ||
              "Ei määritetty"}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="font-semibold text-amber-400">
            {formatCurrency(
              calculateRecommendedPrice(project),
            )}
          </p>

          <p className="mt-1 text-sm text-neutral-500">
            Edistyminen {progress} %
          </p>
        </div>
      </div>
    </Link>
  )
}

function DeadlineRow({
  project,
  overdue = false,
}) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className={`flex items-center justify-between gap-4 rounded-xl border bg-neutral-950 p-4 transition ${
        overdue
          ? "border-red-900/40 hover:border-red-500/60"
          : "border-neutral-800 hover:border-amber-500/50"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">
          {project.name}
        </p>

        <p className="mt-1 text-sm text-neutral-500">
          {formatDate(project.deadline)}
        </p>
      </div>

      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          overdue
            ? "bg-red-500/10 text-red-400"
            : "bg-amber-500/10 text-amber-400"
        }`}
      >
        {formatDaysLeft(project.deadline)}
      </span>
    </Link>
  )
}

function ProgressCard({ project }) {
  const progress =
    calculateWorkflowProgress(project)

  const steps = Array.isArray(
    project.workflowSteps,
  )
    ? project.workflowSteps
    : []

  const completed = steps.filter(
    (step) => step.done,
  ).length

  return (
    <Link
      to={`/projects/${project.id}`}
      className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 transition hover:border-amber-500/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">
            {project.name}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            {completed} / {steps.length} työvaihetta
          </p>
        </div>

        <span className="font-semibold text-amber-400">
          {progress} %
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </Link>
  )
}

function StatusBadge({ status }) {
  return (
    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
      {status}
    </span>
  )
}

function EmptyBox({
  icon,
  title,
  description,
}) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-8 text-center">
      <p className="text-4xl">{icon}</p>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-neutral-400">
        {description}
      </p>
    </div>
  )
}

function calculateMaterialTotal(project) {
  const materials = Array.isArray(
    project.materials,
  )
    ? project.materials
    : []

  return materials.reduce(
    (sum, material) =>
      sum +
      toNumber(material.quantity) *
        toNumber(material.unitPrice),
    0,
  )
}

function calculateProductionCost(project) {
  const laborTotal =
    toNumber(project.laborHours) *
    toNumber(project.hourlyRate)

  return (
    calculateMaterialTotal(project) +
    laborTotal +
    toNumber(project.otherCosts)
  )
}

function calculateRecommendedPrice(project) {
  return (
    calculateProductionCost(project) *
    (1 +
      toNumber(project.markupPercent) / 100)
  )
}

function calculateWorkflowProgress(project) {
  const steps = Array.isArray(
    project.workflowSteps,
  )
    ? project.workflowSteps
    : []

  if (steps.length === 0) {
    return project.status === "Valmis"
      ? 100
      : 0
  }

  const completed = steps.filter(
    (step) => step.done,
  ).length

  return Math.round(
    (completed / steps.length) * 100,
  )
}

function formatDaysLeft(value) {
  if (!value) {
    return "Ei deadlinea"
  }

  const deadline = new Date(value)
  const today = new Date()

  deadline.setHours(12, 0, 0, 0)
  today.setHours(12, 0, 0, 0)

  const days = Math.ceil(
    (deadline.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  )

  if (days < 0) {
    return `${Math.abs(days)} pv myöhässä`
  }

  if (days === 0) {
    return "Tänään"
  }

  return `${days} pv`
}

function formatDate(value) {
  if (!value) {
    return "Ei deadlinea"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Ei tiedossa"
  }

  return new Intl.DateTimeFormat(
    "fi-FI",
  ).format(date)
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(toNumber(value))
}

function formatNumber(value) {
  return new Intl.NumberFormat("fi-FI", {
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

export default Dashboard
