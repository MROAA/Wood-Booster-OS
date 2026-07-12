import { useEffect, useState } from "react"
import ProjectCard from "../components/ProjectCard"

function Projects() {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("woodBoosterProjects")
    return saved ? JSON.parse(saved) : []
  })

  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: "",
    customer: "",
    status: "Suunnittelu",
    deadline: "",
    notes: "",
  })

  useEffect(() => {
    localStorage.setItem(
      "woodBoosterProjects",
      JSON.stringify(projects)
    )
  }, [projects])

  function handleChange(e) {
    const { name, value } = e.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!form.name.trim()) return

    const newProject = {
      id: crypto.randomUUID(),
      ...form,
      materials: [],
    }

    setProjects([newProject, ...projects])

    setForm({
      name: "",
      customer: "",
      status: "Suunnittelu",
      deadline: "",
      notes: "",
    })

    setShowForm(false)
  }

  function deleteProject(id) {
    if (!window.confirm("Poistetaanko projekti?")) return

    setProjects(projects.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
            Projects
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Projektit
          </h1>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black"
        >
          + Uusi projekti
        </button>
      </div>

      {showForm && (
        <ProjectForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onDelete={() => deleteProject(project.id)}
          />
        ))}
      </div>

      {projects.length === 0 && (
        <p className="mt-8 text-neutral-400">
          Ei projekteja vielä.
        </p>
      )}
    </div>
  )
}

function ProjectForm({
  form,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
    >
      <input
        name="name"
        placeholder="Projektin nimi"
        value={form.name}
        onChange={onChange}
        className="mb-3 w-full rounded-xl bg-neutral-950 p-3"
      />

      <input
        name="customer"
        placeholder="Asiakas"
        value={form.customer}
        onChange={onChange}
        className="mb-3 w-full rounded-xl bg-neutral-950 p-3"
      />

      <input
        type="date"
        name="deadline"
        value={form.deadline}
        onChange={onChange}
        className="mb-3 w-full rounded-xl bg-neutral-950 p-3"
      />

      <textarea
        name="notes"
        placeholder="Muistiinpanot"
        value={form.notes}
        onChange={onChange}
        className="mb-4 w-full rounded-xl bg-neutral-950 p-3"
      />

      <div className="flex gap-3">
        <button
          className="rounded-xl bg-amber-500 px-4 py-2 text-black"
        >
          Tallenna
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-neutral-700 px-4 py-2"
        >
          Peruuta
        </button>
      </div>
    </form>
  )
}

export default Projects