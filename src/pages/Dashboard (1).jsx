import { Link } from "react-router"

function Dashboard() {
  const projects = readProjects()

  const activeProjects = projects.filter(
    (project) => project.status !== "Valmis",
  )

  const completedProjects = projects.filter(
    (project) => project.status === "Valmis",
  )

  const totalMaterialCosts = projects.reduce(
    (sum, project) =>
      sum + calculateMaterialTotal(project),
    0,
  )

  const estimatedRevenue = projects.reduce(
    (sum, project) =>
      sum + calculateRecommendedPrice(project),
    0,
  )

  const upcomingProjects = [...activeProjects]
    .filter((project) => project.deadline)
    .sort(
      (first, second) =>
        new Date(first.deadline) -
        new Date(second.deadline),
    )
    .slice(0, 5)

  const recentProjects = [...projects]
    .sort(
      (first, second) =>
        new Date(second.updatedAt || second.createdAt || 0) -
        new Date(first.updatedAt || first.createdAt || 0),
    )
    .slice(0, 4)

  const todayTasks = getTodayTasks(projects)

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
          Hallitse projekteja, kustannuksia, työvaiheita,
          kuvia ja tarjouksia yhdestä paikasta.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/projects"
            className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            Avaa projektit
          </Link>

          <Link
            to="/agents"
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 font-semibold text-neutral-200 transition hover:bg-neutral-800"
          >
            🤖 AI Agents
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="📦"
          label="Kaikki projektit"
          value={projects.length}
          detail={`${activeProjects.length} aktiivista`}
        />

        <StatCard
          icon="✅"
          label="Valmiit projektit"
          value={completedProjects.length}
          detail="Valmiiksi merkityt"
        />

        <StatCard
          icon="🪵"
          label="Materiaalikustannukset"
          value={formatCurrency(totalMaterialCosts)}
          detail="Kaikki projektit"
        />

        <StatCard
          icon="💰"
          label="Arvioitu myynti"
          value={formatCurrency(estimatedRevenue)}
          detail="Suositushintojen summa"
          highlight
        />
      </section>

      <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Today
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Tänään tehtävää
            </h2>
          </div>

          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400">
            {todayTasks.length} tehtävää
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-8 text-center">
            <p className="text-4xl">☕</p>

            <h3 className="mt-4 text-lg font-semibold">
              Ei määrättyjä tehtäviä tälle päivälle
            </h3>

            <p className="mt-2 text-neutral-400">
              Lisää työvaiheelle tämän päivän tavoitepäivä
              projektin Aikajana-välilehdellä.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {todayTasks.map((item) => (
              <TodayTaskRow
                key={`${item.projectId}-${item.task.id}`}
                item={item}
              />
            ))}
          </div>
        )}
      </section>

      {projects.length === 0 ? (
        <EmptyDashboard />
      ) : (
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
                className="text-sm text-amber-400 hover:text-amber-300"
              >
                Näytä kaikki →
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {recentProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Deadlines
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Tulevat määräajat
            </h2>

            {upcomingProjects.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-8 text-center">
                <p className="text-3xl">📅</p>

                <p className="mt-3 text-neutral-400">
                  Ei tulevia deadlineja.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {upcomingProjects.map((project) => (
                  <DeadlineRow
                    key={project.id}
                    project={project}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeProjects.length > 0 && (
        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Progress
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Projektien eteneminen
          </h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {activeProjects.slice(0, 6).map((project) => (
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

function TodayTaskRow({ item }) {
  return (
    <Link
      to={`/projects/${item.projectId}`}
      className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 transition hover:border-amber-500/50 hover:bg-neutral-900"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          item.task.completed
            ? "bg-green-500/10 text-green-400"
            : "bg-amber-500/10 text-amber-400"
        }`}
      >
        {item.task.completed ? "✓" : "•"}
      </span>

      <div className="min-w-0">
        <p
          className={`truncate font-medium ${
            item.task.completed
              ? "text-neutral-500 line-through"
              : "text-neutral-200"
          }`}
        >
          {getTaskName(item.task)}
        </p>

        <p className="mt-1 truncate text-sm text-neutral-500">
          {item.projectName}
        </p>
      </div>
    </Link>
  )
}

function StatCard({
  icon,
  label,
  value,
  detail,
  highlight = false,
}) {
  return (
    <article
      className={`rounded-2xl border p-6 ${
        highlight
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">
            {label}
          </p>

          <p
            className={`mt-3 text-3xl font-bold ${
              highlight
                ? "text-amber-400"
                : "text-neutral-100"
            }`}
          >
            {value}
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            {detail}
          </p>
        </div>

        <span className="text-3xl">{icon}</span>
      </div>
    </article>
  )
}

function ProjectRow({ project }) {
  const progress = calculateProgress(project)
  const recommendedPrice =
    calculateRecommendedPrice(project)

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

            <StatusBadge status={project.status} />
          </div>

          <p className="mt-2 text-sm text-neutral-500">
            {project.customer || "Ei asiakasta"}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="font-semibold text-amber-400">
            {formatCurrency(recommendedPrice)}
          </p>

          <p className="mt-1 text-sm text-neutral-500">
            Edistyminen {progress} %
          </p>
        </div>
      </div>
    </Link>
  )
}

function DeadlineRow({ project }) {
  const daysLeft = calculateDaysLeft(project.deadline)

  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 transition hover:border-amber-500/50"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-neutral-200">
          {project.name}
        </p>

        <p className="mt-1 text-sm text-neutral-500">
          {formatDate(project.deadline)}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
          daysLeft < 0
            ? "bg-red-500/10 text-red-400"
            : daysLeft <= 7
              ? "bg-amber-500/10 text-amber-400"
              : "bg-green-500/10 text-green-400"
        }`}
      >
        {daysLeft < 0
          ? `${Math.abs(daysLeft)} pv myöhässä`
          : daysLeft === 0
            ? "Tänään"
            : `${daysLeft} pv`}
      </span>
    </Link>
  )
}

function ProgressCard({ project }) {
  const progress = calculateProgress(project)

  const tasks = Array.isArray(project.timeline)
    ? project.timeline
    : []

  const completedTasks = tasks.filter(
    (task) => Boolean(task?.completed),
  ).length

  return (
    <Link
      to={`/projects/${project.id}`}
      className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 transition hover:border-amber-500/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-neutral-100">
            {project.name}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            {completedTasks} / {tasks.length} työvaihetta
          </p>
        </div>

        <span className="font-semibold text-amber-400">
          {progress} %
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Link>
  )
}

function StatusBadge({ status }) {
  return (
    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
      {status || "Ei tilaa"}
    </span>
  )
}

function EmptyDashboard() {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-neutral-700 p-12 text-center">
      <p className="text-5xl">🪵</p>

      <h2 className="mt-5 text-2xl font-semibold">
        Command Center odottaa ensimmäistä projektia
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-neutral-400">
        Luo ensimmäinen projekti ja lisää siihen materiaalit,
        työvaiheet, kustannukset, kuvat ja muistiinpanot.
      </p>

      <Link
        to="/projects"
        className="mt-6 inline-block rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
      >
        Luo ensimmäinen projekti
      </Link>
    </section>
  )
}

function getTodayTasks(projects) {
  const today = getLocalDateValue(new Date())

  return projects.flatMap((project) => {
    const tasks = Array.isArray(project.timeline)
      ? project.timeline
      : []

    return tasks
      .filter(
        (task) =>
          task &&
          typeof task === "object" &&
          task.deadline === today,
      )
      .map((task) => ({
        projectId: project.id,
        projectName: project.name || "Nimetön projekti",
        task,
      }))
  })
}

function getTaskName(task) {
  if (typeof task?.name === "string") {
    return task.name
  }

  if (typeof task?.text === "string") {
    return task.text
  }

  return "Nimetön työvaihe"
}

function getLocalDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function calculateMaterialTotal(project) {
  const materials = Array.isArray(project.materials)
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

function calculateRecommendedPrice(project) {
  const materialTotal =
    calculateMaterialTotal(project)

  const costing = project.costing || {}

  const laborTotal =
    toNumber(costing.laborHours) *
    toNumber(costing.hourlyRate)

  const productionCost =
    materialTotal +
    laborTotal +
    toNumber(costing.otherCosts)

  return (
    productionCost *
    (1 + toNumber(costing.markupPercent) / 100)
  )
}

function calculateProgress(project) {
  const tasks = Array.isArray(project.timeline)
    ? project.timeline
    : []

  if (tasks.length === 0) {
    return project.status === "Valmis" ? 100 : 0
  }

  const completedTasks = tasks.filter(
    (task) => Boolean(task?.completed),
  ).length

  return Math.round(
    (completedTasks / tasks.length) * 100,
  )
}

function calculateDaysLeft(dateValue) {
  const today = new Date()
  const deadline = new Date(`${dateValue}T12:00:00`)

  today.setHours(12, 0, 0, 0)

  const difference =
    deadline.getTime() - today.getTime()

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24),
  )
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("fi-FI").format(
    new Date(`${dateValue}T12:00:00`),
  )
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(toNumber(value))
}

function readProjects() {
  try {
    const savedProjects = localStorage.getItem(
      "woodBoosterProjects",
    )

    const projects = savedProjects
      ? JSON.parse(savedProjects)
      : []

    return Array.isArray(projects)
      ? projects
      : []
  } catch {
    return []
  }
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

export default Dashboard
