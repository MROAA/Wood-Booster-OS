import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"

import MaterialsTab from "../components/MaterialsTab"
import ProjectEditor from "../components/ProjectEditor"
import QuoteTab from "../components/QuoteTab"
import WorkflowTab from "../components/WorkflowTab"
import CostCalculator from "../components/project/CostCalculator"
import FilesTab from "../components/project/FilesTab"

function ProjectDetails() {
  const { projectId } = useParams()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(
          `http://localhost:3001/api/projects/${projectId}`,
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Projektin lataaminen epäonnistui",
          )
        }

        setProject(data)
      } catch (loadError) {
        console.error(loadError)
        setError(loadError.message)
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  function handleProjectUpdated(updatedProject) {
    if (!updatedProject) {
      return
    }

    setProject(updatedProject)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 p-10 text-white">
        Ladataan projektia...
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-neutral-950 p-10 text-white">
        <h1 className="text-3xl font-bold">
          Projektia ei löytynyt
        </h1>

        {error && (
          <p className="mt-4 text-red-400">
            {error}
          </p>
        )}

        <Link
          to="/projects"
          className="mt-5 inline-block text-amber-400"
        >
          ← Takaisin projekteihin
        </Link>
      </main>
    )
  }

  const materials = Array.isArray(project.materials)
    ? project.materials
    : []

  const workflowSteps = Array.isArray(
    project.workflowSteps,
  )
    ? project.workflowSteps
    : []

  const materialTotal = materials.reduce(
    (sum, material) =>
      sum +
      toNumber(material.quantity) *
        toNumber(material.unitPrice),
    0,
  )

  const laborTotal =
    toNumber(project.laborHours) *
    toNumber(project.hourlyRate)

  const otherCosts = toNumber(project.otherCosts)

  const productionCost =
    materialTotal + laborTotal + otherCosts

  const recommendedPrice =
    productionCost *
    (1 +
      toNumber(project.markupPercent) / 100)

  const completedSteps = workflowSteps.filter(
    (step) => step.done,
  ).length

  const workflowProgress =
    workflowSteps.length === 0
      ? 0
      : Math.round(
          (completedSteps / workflowSteps.length) * 100,
        )

  const quoteProject = {
    ...project,
    customer:
      project.customer?.name ||
      "Asiakasta ei määritetty",
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          to="/projects"
          className="text-amber-400"
        >
          ← Takaisin projekteihin
        </Link>

        <header className="mt-8">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
            Wood-Booster Project
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            🪵 {project.name}
          </h1>

          <p className="mt-4 text-neutral-400">
            Projekti-ID: {project.id}
          </p>
        </header>

        <nav className="mt-10 overflow-x-auto border-b border-neutral-800">
          <div className="flex min-w-max gap-2">
            <TabButton
              active={activeTab === "overview"}
              onClick={() =>
                setActiveTab("overview")
              }
            >
              Yleiskatsaus
            </TabButton>

            <TabButton
              active={activeTab === "materials"}
              onClick={() =>
                setActiveTab("materials")
              }
            >
              Materiaalit
              {materials.length > 0 && (
                <CountBadge>
                  {materials.length}
                </CountBadge>
              )}
            </TabButton>

            <TabButton
              active={activeTab === "pricing"}
              onClick={() =>
                setActiveTab("pricing")
              }
            >
              Hinnoittelu
            </TabButton>

            <TabButton
              active={activeTab === "quote"}
              onClick={() =>
                setActiveTab("quote")
              }
            >
              Tarjous
            </TabButton>

            <TabButton
              active={activeTab === "workflow"}
              onClick={() =>
                setActiveTab("workflow")
              }
            >
              Työvaiheet
              {workflowSteps.length > 0 && (
                <CountBadge>
                  {workflowSteps.length}
                </CountBadge>
              )}
            </TabButton>

            <TabButton
              active={activeTab === "files"}
              onClick={() =>
                setActiveTab("files")
              }
            >
              Tiedostot
            </TabButton>
          </div>
        </nav>

        <div className="mt-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <OverviewTab
                project={project}
                materialTotal={materialTotal}
                productionCost={productionCost}
                recommendedPrice={recommendedPrice}
                workflowProgress={workflowProgress}
              />

              <ProjectEditor
                project={project}
                onProjectUpdated={handleProjectUpdated}
              />
            </div>
          )}

          {activeTab === "materials" && (
            <MaterialsTab project={project} />
          )}

          {activeTab === "pricing" && (
            <CostCalculator
              project={project}
              onProjectUpdated={handleProjectUpdated}
            />
          )}

          {activeTab === "quote" && (
            <QuoteTab
              project={quoteProject}
              materialTotal={materialTotal}
              laborTotal={laborTotal}
              otherCosts={otherCosts}
              productionCost={productionCost}
              recommendedPrice={recommendedPrice}
            />
          )}

          {activeTab === "workflow" && (
            <WorkflowTab projectId={project.id} />
          )}

          {activeTab === "files" && (
            <FilesTab projectId={project.id} />
          )}
        </div>
      </div>
    </main>
  )
}

function OverviewTab({
  project,
  materialTotal,
  productionCost,
  recommendedPrice,
  workflowProgress,
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-2xl font-semibold">
          Asiakas
        </h2>

        {project.customer ? (
          <div className="mt-5 space-y-3 text-neutral-300">
            <p>👤 {project.customer.name}</p>

            <p>
              🏢{" "}
              {project.customer.company ||
                "Ei yritystä"}
            </p>

            <p>
              ✉{" "}
              {project.customer.email ||
                "Ei sähköpostia"}
            </p>

            <p>
              ☎{" "}
              {project.customer.phone ||
                "Ei puhelinta"}
            </p>
          </div>
        ) : (
          <p className="mt-5 text-neutral-500">
            Asiakasta ei määritetty
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-2xl font-semibold">
          Projektin tiedot
        </h2>

        <div className="mt-5 space-y-3 text-neutral-300">
          <p>
            📅 Luotu:{" "}
            {formatDate(project.createdAt)}
          </p>

          <p>
            🚧 Tila:{" "}
            {project.status || "Suunnittelu"}
          </p>

          <p>
            🪵 Materiaaleja: {materialsCount(project)} kpl
          </p>

          <p>
            ⏱️ Työtunnit:{" "}
            {toNumber(project.laborHours)} h
          </p>

          <p>
            🛠️ Työvaiheet:{" "}
            {workflowProgress} % valmis
          </p>

          <p>
            📅 Deadline:{" "}
            {project.deadline
              ? formatDate(project.deadline)
              : "Ei asetettu"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 lg:col-span-2">
        <h2 className="text-2xl font-semibold">
          Projektin yhteenveto
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <SummaryCard
            label="Materiaalit"
            value={formatCurrency(materialTotal)}
          />

          <SummaryCard
            label="Tuotantokustannus"
            value={formatCurrency(productionCost)}
          />

          <SummaryCard
            label="Suositeltu myyntihinta"
            value={formatCurrency(
              recommendedPrice,
            )}
            highlight
          />

          <SummaryCard
            label="Valmistuminen"
            value={`${workflowProgress} %`}
          />
        </div>
      </section>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-4 text-sm font-medium transition ${
        active
          ? "border-amber-500 text-amber-400"
          : "border-transparent text-neutral-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  )
}

function CountBadge({ children }) {
  return (
    <span className="ml-2 rounded-full bg-neutral-800 px-2 py-0.5 text-xs">
      {children}
    </span>
  )
}

function SummaryCard({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="rounded-xl bg-neutral-950 p-5">
      <p className="text-sm text-neutral-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${
          highlight
            ? "text-amber-400"
            : "text-neutral-100"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function materialsCount(project) {
  return Array.isArray(project.materials)
    ? project.materials.length
    : 0
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(toNumber(value))
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Ei tiedossa"
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return "Ei tiedossa"
  }

  return new Intl.DateTimeFormat(
    "fi-FI",
  ).format(date)
}

export default ProjectDetails
