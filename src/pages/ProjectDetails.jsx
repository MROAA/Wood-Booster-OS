import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"

import ProjectEditor from "../components/ProjectEditor"
import QuoteTab from "../components/QuoteTab"
import TimelineTab from "../components/TimelineTab"
import WorkflowTab from "../components/WorkflowTab"
import MaterialsTab from "../components/MaterialsTab"
import CostCalculator from "../components/project/CostCalculator"

function ProjectDetails() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [newNote, setNewNote] = useState("")

  useEffect(() => {
    const savedProjects = readProjects()

    setProjects(savedProjects)

    const matchingProject = findProject(
      savedProjects,
      projectId,
    )

    setProject(matchingProject)
  }, [projectId])

  const notes = useMemo(() => {
    if (!Array.isArray(project?.notes)) {
      return []
    }

    return [...project.notes].sort((firstNote, secondNote) => {
      const firstDate = new Date(
        firstNote.updatedAt || firstNote.createdAt || 0,
      )

      const secondDate = new Date(
        secondNote.updatedAt || secondNote.createdAt || 0,
      )

      return secondDate - firstDate
    })
  }, [project])

  function handleProjectUpdated(
    updatedProject,
    updatedProjects,
  ) {
    if (!updatedProject) {
      return
    }

    setProject(updatedProject)

    if (Array.isArray(updatedProjects)) {
      setProjects(updatedProjects)
    }
  }

  function handleAddNote(event) {
    event.preventDefault()

    const noteText = newNote.trim()

    if (!noteText || !project) {
      return
    }

    const now = new Date().toISOString()

    const note = {
      id: createId(),
      text: noteText,
      createdAt: now,
      updatedAt: now,
    }

    updateCurrentProject({
      notes: [
        ...(Array.isArray(project.notes)
          ? project.notes
          : []),
        note,
      ],
    })

    setNewNote("")
  }

  function handleEditNote(noteId) {
    const currentNote = notes.find(
      (note) => note.id === noteId,
    )

    if (!currentNote) {
      return
    }

    const editedText = window.prompt(
      "Muokkaa muistiinpanoa:",
      currentNote.text,
    )

    if (editedText === null) {
      return
    }

    const trimmedText = editedText.trim()

    if (!trimmedText) {
      return
    }

    const updatedNotes = (
      Array.isArray(project.notes)
        ? project.notes
        : []
    ).map((note) => {
      if (note.id !== noteId) {
        return note
      }

      return {
        ...note,
        text: trimmedText,
        updatedAt: new Date().toISOString(),
      }
    })

    updateCurrentProject({
      notes: updatedNotes,
    })
  }

  function handleDeleteNote(noteId) {
    const shouldDelete = window.confirm(
      "Poistetaanko tämä muistiinpano?",
    )

    if (!shouldDelete) {
      return
    }

    const updatedNotes = (
      Array.isArray(project.notes)
        ? project.notes
        : []
    ).filter((note) => note.id !== noteId)

    updateCurrentProject({
      notes: updatedNotes,
    })
  }

  function updateCurrentProject(changes) {
    const updatedAt = new Date().toISOString()

    const updatedProjects = projects.map(
      (currentProject) => {
        if (
          String(currentProject.id) !==
          String(project.id)
        ) {
          return currentProject
        }

        return {
          ...currentProject,
          ...changes,
          updatedAt,
        }
      },
    )

    const updatedProject = updatedProjects.find(
      (currentProject) =>
        String(currentProject.id) ===
        String(project.id),
    )

    localStorage.setItem(
      "woodBoosterProjects",
      JSON.stringify(updatedProjects),
    )

    setProjects(updatedProjects)
    setProject(updatedProject)
  }

  function handleDeleteProject() {
    const shouldDelete = window.confirm(
      `Poistetaanko projekti "${project.name}"? Tätä toimintoa ei voi perua.`,
    )

    if (!shouldDelete) {
      return
    }

    const updatedProjects = projects.filter(
      (currentProject) =>
        String(currentProject.id) !==
        String(project.id),
    )

    localStorage.setItem(
      "woodBoosterProjects",
      JSON.stringify(updatedProjects),
    )

    navigate("/projects")
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="text-sm text-neutral-400 transition hover:text-white"
          >
            ← Takaisin projekteihin
          </button>

          <section className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-500">
              Project not found
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Projektia ei löytynyt
            </h1>

            <p className="mt-3 text-neutral-400">
              Projekti on ehkä poistettu tai osoite on
              virheellinen.
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="text-sm text-neutral-400 transition hover:text-white"
        >
          ← Takaisin projekteihin
        </button>

        <header className="mt-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
                Wood-Booster Project
              </p>

              <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                {project.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={project.status} />

                {project.customer && (
                  <span className="text-neutral-400">
                    Asiakas:{" "}
                    <span className="text-neutral-200">
                      {project.customer}
                    </span>
                  </span>
                )}

                {project.deadline && (
                  <span className="text-neutral-400">
                    Deadline:{" "}
                    <span className="text-neutral-200">
                      {formatDate(project.deadline)}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeleteProject}
              className="self-start rounded-xl border border-red-900/70 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-300 transition hover:border-red-700 hover:bg-red-950/60"
            >
              Poista projekti
            </button>
          </div>
        </header>

        <nav className="mt-10 overflow-x-auto border-b border-neutral-800">
          <div className="flex min-w-max gap-1">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              Yleiskatsaus
            </TabButton>

            <TabButton
              active={activeTab === "notes"}
              onClick={() => setActiveTab("notes")}
            >
              Muistiinpanot
              {notes.length > 0 && (
                <span className="ml-2 rounded-full bg-neutral-800 px-2 py-0.5 text-xs">
                  {notes.length}
                </span>
              )}
            </TabButton>

            <TabButton
              active={activeTab === "quote"}
              onClick={() => setActiveTab("quote")}
            >
              Tarjous
            </TabButton>

            <TabButton
              active={activeTab === "timeline"}
              onClick={() => setActiveTab("timeline")}
            >
              Aikajana
            </TabButton>

            <TabButton
              active={activeTab === "workflow"}
              onClick={() => setActiveTab("workflow")}
            >
              Työvaiheet
            </TabButton>

            <TabButton
              active={activeTab === "pricing"}
              onClick={() => setActiveTab("pricing")}
            >
              Hinnoittelu
            </TabButton>

            <TabButton
              active={activeTab === "materials"}
              onClick={() => setActiveTab("materials")}
            >
              Materiaalit
            </TabButton>

            <TabButton
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            >
              Asetukset
            </TabButton>
          </div>
        </nav>

        <div className="mt-8">
          {activeTab === "overview" && (
            <OverviewTab
              project={project}
              noteCount={notes.length}
            />
          )}

          {activeTab === "notes" && (
            <NotesTab
              notes={notes}
              newNote={newNote}
              onNewNoteChange={setNewNote}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activeTab === "quote" && (
            <QuoteTab
              project={project}
              materialTotal={calculateMaterialTotal(project)}
              laborTotal={calculateLaborTotal(project)}
              otherCosts={toNumber(project.costing?.otherCosts)}
              productionCost={calculateProductionCost(project)}
              recommendedPrice={calculateRecommendedPrice(project)}
            />
          )}

          {activeTab === "timeline" && (
            <TimelineTab
              project={project}
              projectId={project.id}
              onProjectUpdated={handleProjectUpdated}
            />
          )}

          {activeTab === "workflow" && (
            <WorkflowTab projectId={project.id} />
          )}

          {activeTab === "materials" && (
  <MaterialsTab
    project={project}
    onProjectUpdated={handleProjectUpdated}
  />
)}

          {activeTab === "pricing" && (
            <CostCalculator
              project={project}
              onProjectUpdated={handleProjectUpdated}
            />
          )}

          {activeTab === "settings" && (
            <ProjectEditor
              projectId={project.id}
              onProjectUpdated={handleProjectUpdated}
            />
          )}
        </div>
      </div>
    </main>
  )
}

function OverviewTab({ project, noteCount }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Project description
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Projektin kuvaus
        </h2>

        {project.description ? (
          <p className="mt-5 whitespace-pre-wrap leading-7 text-neutral-300">
            {project.description}
          </p>
        ) : (
          <p className="mt-5 text-neutral-500">
            Projektille ei ole vielä lisätty kuvausta.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Project information
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Projektin tiedot
        </h2>

        <dl className="mt-6 space-y-5">
          <InfoRow
            label="Asiakas"
            value={project.customer || "Ei määritetty"}
          />

          <InfoRow
            label="Tila"
            value={project.status || "Suunnittelu"}
          />

          <InfoRow
            label="Deadline"
            value={
              project.deadline
                ? formatDate(project.deadline)
                : "Ei määritetty"
            }
          />

          <InfoRow
            label="Muistiinpanoja"
            value={String(noteCount)}
          />

          <InfoRow
            label="Luotu"
            value={
              project.createdAt
                ? formatDateTime(project.createdAt)
                : "Ei tiedossa"
            }
          />

          <InfoRow
            label="Päivitetty"
            value={
              project.updatedAt
                ? formatDateTime(project.updatedAt)
                : "Ei tiedossa"
            }
          />
        </dl>
      </section>
    </div>
  )
}

function NotesTab({
  notes,
  newNote,
  onNewNoteChange,
  onAddNote,
  onEditNote,
  onDeleteNote,
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          New note
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Lisää muistiinpano
        </h2>

        <form
          onSubmit={onAddNote}
          className="mt-6"
        >
          <textarea
            value={newNote}
            onChange={(event) =>
              onNewNoteChange(event.target.value)
            }
            rows={7}
            placeholder="Kirjoita projektia koskeva muistiinpano..."
            className="w-full resize-y rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"
          />

          <button
            type="submit"
            className="mt-4 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            Tallenna muistiinpano
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Project notes
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Muistiinpanot
            </h2>
          </div>

          <span className="text-sm text-neutral-500">
            {notes.length} kpl
          </span>
        </div>

        {notes.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/50 p-6 text-center">
            <p className="text-neutral-400">
              Muistiinpanoja ei ole vielä lisätty.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {notes.map((note) => (
              <article
                key={note.id}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-5"
              >
                <p className="whitespace-pre-wrap leading-7 text-neutral-200">
                  {note.text}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-4">
                  <span className="text-xs text-neutral-500">
                    {formatDateTime(
                      note.updatedAt ||
                        note.createdAt,
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEditNote(note.id)
                      }
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-amber-500 hover:text-amber-400"
                    >
                      Muokkaa
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDeleteNote(note.id)
                      }
                      className="rounded-lg border border-red-950 px-3 py-1.5 text-sm text-red-400 transition hover:border-red-700 hover:bg-red-950/40"
                    >
                      Poista
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
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

function InfoRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </dt>

      <dd className="mt-1 text-neutral-200">
        {value}
      </dd>
    </div>
  )
}

function StatusBadge({ status }) {
  const statusClasses = {
    Idea: "border-purple-800 bg-purple-950/50 text-purple-300",
    Suunnittelu:
      "border-blue-800 bg-blue-950/50 text-blue-300",
    Tarjous:
      "border-yellow-800 bg-yellow-950/50 text-yellow-300",
    Tuotannossa:
      "border-orange-800 bg-orange-950/50 text-orange-300",
    Viimeistely:
      "border-pink-800 bg-pink-950/50 text-pink-300",
    Toimitus:
      "border-cyan-800 bg-cyan-950/50 text-cyan-300",
    Valmis:
      "border-green-800 bg-green-950/50 text-green-300",
  }

  const classes =
    statusClasses[status] ||
    "border-neutral-700 bg-neutral-800 text-neutral-300"

  return (
    <span
      className={`rounded-full border px-3 py-1 text-sm ${classes}`}
    >
      {status || "Suunnittelu"}
    </span>
  )
}

function readProjects() {
  try {
    const savedProjects = localStorage.getItem(
      "woodBoosterProjects",
    )

    const parsedProjects = savedProjects
      ? JSON.parse(savedProjects)
      : []

    return Array.isArray(parsedProjects)
      ? parsedProjects
      : []
  } catch {
    return []
  }
}

function findProject(projects, projectId) {
  return (
    projects.find(
      (currentProject) =>
        String(currentProject.id) ===
        String(projectId),
    ) || null
  )
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Ei määritetty"
  }

  const date = new Date(`${dateValue}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(date)
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Ei tiedossa"
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return "Ei tiedossa"
  }

  return new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}


function calculateMaterialTotal(project) {
  const materials = Array.isArray(project?.materials)
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

function calculateLaborTotal(project) {
  return (
    toNumber(project?.costing?.laborHours) *
    toNumber(project?.costing?.hourlyRate)
  )
}

function calculateProductionCost(project) {
  return (
    calculateMaterialTotal(project) +
    calculateLaborTotal(project) +
    toNumber(project?.costing?.otherCosts)
  )
}

function calculateRecommendedPrice(project) {
  const productionCost =
    calculateProductionCost(project)

  return (
    productionCost *
    (1 +
      toNumber(project?.costing?.markupPercent) /
        100)
  )
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

export default ProjectDetails