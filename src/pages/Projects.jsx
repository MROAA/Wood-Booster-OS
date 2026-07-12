import { useEffect, useState } from "react"

import ProjectCard from "../components/ProjectCard"
import { getCustomers } from "../data/CustomerStore"

function Projects() {
  const [projects, setProjects] = useState(() =>
    readProjects(),
  )

  const [customers] = useState(() =>
    getCustomers(),
  )

  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: "",
    customerId: "",
    status: "Suunnittelu",
    deadline: "",
    notes: "",
  })

  useEffect(() => {
    localStorage.setItem(
      "woodBoosterProjects",
      JSON.stringify(projects),
    )
  }, [projects])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const projectName = form.name.trim()

    if (!projectName) {
      return
    }

    const selectedCustomer = customers.find(
      (customer) =>
        String(customer.id) ===
        String(form.customerId),
    )

    const now = new Date().toISOString()

    const newProject = {
      id: createId(),
      name: projectName,
      customerId: selectedCustomer?.id || "",
      customer: selectedCustomer?.name || "",
      status: form.status,
      deadline: form.deadline,
      notes: form.notes.trim(),
      description: "",
      materials: [],
      timeline: [],
      gallery: [],
      costing: {},
      createdAt: now,
      updatedAt: now,
    }

    setProjects((currentProjects) => [
      newProject,
      ...currentProjects,
    ])

    setForm({
      name: "",
      customerId: "",
      status: "Suunnittelu",
      deadline: "",
      notes: "",
    })

    setShowForm(false)
  }

  function deleteProject(projectId) {
    const shouldDelete = window.confirm(
      "Poistetaanko projekti?",
    )

    if (!shouldDelete) {
      return
    }

    setProjects((currentProjects) =>
      currentProjects.filter(
        (project) =>
          String(project.id) !== String(projectId),
      ),
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
            Projects
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Projektit
          </h1>

          <p className="mt-3 text-neutral-400">
            Hallitse asiakasprojekteja ja niiden etenemistä.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="self-start rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
        >
          + Uusi projekti
        </button>
      </div>

      {showForm && (
        <ProjectForm
          form={form}
          customers={customers}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {projects.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-700 p-10 text-center">
          <p className="text-5xl">📦</p>

          <h2 className="mt-5 text-xl font-semibold">
            Ei projekteja vielä
          </h2>

          <p className="mt-2 text-neutral-400">
            Luo ensimmäinen projekti painamalla
            Uusi projekti -painiketta.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={() =>
                deleteProject(project.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectForm({
  form,
  customers,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Projektin nimi">
          <input
            type="text"
            name="name"
            placeholder="Esimerkiksi Aurora-pöytä"
            value={form.name}
            onChange={onChange}
            required
            className={inputClasses}
          />
        </FormField>

        <FormField label="Asiakas">
          <select
            name="customerId"
            value={form.customerId}
            onChange={onChange}
            className={inputClasses}
          >
            <option value="">
              Ei valittua asiakasta
            </option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.name}
                {customer.company
                  ? ` – ${customer.company}`
                  : ""}
              </option>
            ))}
          </select>

          {customers.length === 0 && (
            <p className="mt-2 text-sm text-amber-400">
              Lisää ensin asiakas Asiakkaat-sivulla.
            </p>
          )}
        </FormField>

        <FormField label="Projektin tila">
          <select
            name="status"
            value={form.status}
            onChange={onChange}
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
            onChange={onChange}
            className={inputClasses}
          />
        </FormField>
      </div>

      <div className="mt-5">
        <FormField label="Muistiinpanot">
          <textarea
            name="notes"
            placeholder="Projektin ensimmäiset muistiinpanot..."
            value={form.notes}
            onChange={onChange}
            rows={5}
            className={`${inputClasses} resize-y`}
          />
        </FormField>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
        >
          Tallenna projekti
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-neutral-700 px-5 py-3 text-neutral-300 transition hover:bg-neutral-800"
        >
          Peruuta
        </button>
      </div>
    </form>
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

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"

export default Projects