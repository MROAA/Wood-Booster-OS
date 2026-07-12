import { useEffect, useState } from "react"

function ProjectEditor({
  projectId,
  onProjectUpdated,
}) {
  const [form, setForm] = useState({
    name: "",
    customer: "",
    status: "Suunnittelu",
    deadline: "",
    description: "",
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const projects = readProjects()

    const project = projects.find(
      (item) => item.id === projectId,
    )

    if (!project) {
      return
    }

    setForm({
      name: project.name || "",
      customer: project.customer || "",
      status: project.status || "Suunnittelu",
      deadline: project.deadline || "",
      description: project.description || "",
    })

    setSaved(false)
  }, [projectId])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))

    setSaved(false)
  }

  function handleSubmit(event) {
    event.preventDefault()

    const projectName = form.name.trim()

    if (!projectName) {
      return
    }

    const projects = readProjects()

    const updatedProjects = projects.map((project) => {
      if (project.id !== projectId) {
        return project
      }

      return {
        ...project,
        name: projectName,
        customer: form.customer.trim(),
        status: form.status,
        deadline: form.deadline,
        description: form.description.trim(),
        updatedAt: new Date().toISOString(),
      }
    })

    localStorage.setItem(
      "woodBoosterProjects",
      JSON.stringify(updatedProjects),
    )

    const updatedProject = updatedProjects.find(
      (project) => project.id === projectId,
    )

    onProjectUpdated?.(
      updatedProject,
      updatedProjects,
    )

    setSaved(true)
  }

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <p className="text-xs uppercase tracking-wider text-neutral-500">
        Project settings
      </p>

      <h3 className="mt-2 text-2xl font-semibold">
        Muokkaa projektia
      </h3>

      <p className="mt-2 text-neutral-400">
        Päivitä projektin perustiedot ja nykyinen tila.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Projektin nimi">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className={inputClasses}
            />
          </FormField>

          <FormField label="Asiakas">
            <input
              type="text"
              name="customer"
              value={form.customer}
              onChange={handleChange}
              placeholder="Asiakkaan nimi"
              className={inputClasses}
            />
          </FormField>

          <FormField label="Projektin tila">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="Idea">Idea</option>

              <option value="Suunnittelu">
                Suunnittelu
              </option>

              <option value="Tarjous">
                Tarjous
              </option>

              <option value="Tuotannossa">
                Tuotannossa
              </option>

              <option value="Viimeistely">
                Viimeistely
              </option>

              <option value="Toimitus">
                Toimitus
              </option>

              <option value="Valmis">
                Valmis
              </option>
            </select>
          </FormField>

          <FormField label="Deadline">
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>
        </div>

        <div className="mt-5">
          <FormField label="Projektin kuvaus">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={6}
              placeholder="Kuvaile tuote, asiakkaan toiveet ja projektin tavoite..."
              className={`${inputClasses} resize-y`}
            />
          </FormField>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            Tallenna muutokset
          </button>

          {saved && (
            <span className="text-sm text-green-400">
              ✓ Projekti päivitetty
            </span>
          )}
        </div>
      </form>
    </section>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-300">
        {label}
      </span>

      {children}
    </label>
  )
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

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-500"

export default ProjectEditor