import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"

const API_URL = "http://localhost:3001/api"

function Projects() {
  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: "",
    customerId: "",
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError("")

        const [projectsResponse, customersResponse] =
          await Promise.all([
            fetch(`${API_URL}/projects`),
            fetch(`${API_URL}/customers`),
          ])

        const projectsData =
          await projectsResponse.json()

        const customersData =
          await customersResponse.json()

        if (!projectsResponse.ok) {
          throw new Error(
            projectsData.error ||
              "Projektien lataaminen epäonnistui",
          )
        }

        if (!customersResponse.ok) {
          throw new Error(
            customersData.error ||
              "Asiakkaiden lataaminen epäonnistui",
          )
        }

        setProjects(
          Array.isArray(projectsData)
            ? projectsData
            : [],
        )

        setCustomers(
          Array.isArray(customersData)
            ? customersData
            : [],
        )
      } catch (loadError) {
        console.error(loadError)
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const sortedProjects = useMemo(() => {
    return [...projects].sort(
      (first, second) =>
        new Date(second.createdAt) -
        new Date(first.createdAt),
    )
  }, [projects])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const name = form.name.trim()
    const customerId = Number(form.customerId)

    if (!name) {
      setError("Kirjoita projektin nimi.")
      return
    }

    if (!Number.isInteger(customerId)) {
      setError("Valitse asiakas.")
      return
    }

    try {
      setSaving(true)
      setError("")

      const response = await fetch(
        `${API_URL}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            customerId,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Projektin tallentaminen epäonnistui",
        )
      }

      const customer =
        customers.find(
          (item) => item.id === customerId,
        ) || null

      const newProject = {
        ...data,
        customer,
        materials: [],
        workflowSteps: [],
      }

      setProjects((current) => [
        newProject,
        ...current,
      ])

      setForm({
        name: "",
        customerId: "",
      })

      setShowForm(false)
    } catch (saveError) {
      console.error(saveError)
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(project) {
    const shouldDelete = window.confirm(
      `Poistetaanko projekti "${project.name}"?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      setError("")

      const response = await fetch(
        `${API_URL}/projects/${project.id}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Projektin poistaminen epäonnistui",
        )
      }

      setProjects((current) =>
        current.filter(
          (item) => item.id !== project.id,
        ),
      )
    } catch (deleteError) {
      console.error(deleteError)
      setError(deleteError.message)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
              Projects
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Projektit
            </h1>

            <p className="mt-3 text-neutral-400">
              Hallitse tietokantaan tallennettuja
              asiakasprojekteja.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowForm((current) => !current)
            }
            className="self-start rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            {showForm
              ? "Sulje lomake"
              : "+ Uusi projekti"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Projektin nimi">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Esimerkiksi Aurora-pöytä"
                  className={inputClasses}
                />
              </FormField>

              <FormField label="Asiakas">
                <select
                  name="customerId"
                  value={form.customerId}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="">
                    Valitse asiakas
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
              </FormField>
            </div>

            {customers.length === 0 && (
              <p className="mt-4 text-sm text-amber-400">
                Lisää ensin asiakas Asiakkaat-sivulla.
              </p>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-6 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Tallennetaan..."
                : "Tallenna projekti"}
            </button>
          </form>
        )}

        {error && !showForm && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-neutral-400">
            Ladataan projekteja...
          </p>
        ) : sortedProjects.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-700 p-10 text-center">
            <p className="text-5xl">📦</p>

            <h2 className="mt-5 text-xl font-semibold">
              Ei projekteja vielä
            </h2>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {sortedProjects.map((project) => {
              const materialTotal =
                calculateMaterialTotal(project)

              const progress =
                calculateWorkflowProgress(project)

              return (
                <article
                  key={project.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-neutral-500">
                        Projekti #{project.id}
                      </p>

                      <h2 className="mt-2 truncate text-2xl font-semibold">
                        {project.name}
                      </h2>

                      <p className="mt-2 text-neutral-400">
                        Asiakas:{" "}
                        <span className="text-neutral-200">
                          {project.customer?.name ||
                            "Ei asiakasta"}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(project)
                      }
                      className="rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                    >
                      Poista
                    </button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <InfoCard
                      label="Materiaalit"
                      value={formatCurrency(
                        materialTotal,
                      )}
                    />

                    <InfoCard
                      label="Työvaiheet"
                      value={`${progress} %`}
                    />

                    <InfoCard
                      label="Luotu"
                      value={formatDate(
                        project.createdAt,
                      )}
                    />
                  </div>

                  <Link
                    to={`/projects/${project.id}`}
                    className="mt-6 inline-flex rounded-xl border border-amber-500 px-4 py-3 font-semibold text-amber-400 transition hover:bg-amber-500/10"
                  >
                    Avaa projekti →
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
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

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl bg-neutral-950 p-4">
      <p className="text-xs text-neutral-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-neutral-200">
        {value}
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

function calculateWorkflowProgress(project) {
  const steps = Array.isArray(
    project.workflowSteps,
  )
    ? project.workflowSteps
    : []

  if (steps.length === 0) {
    return 0
  }

  const completed = steps.filter(
    (step) => step.done,
  ).length

  return Math.round(
    (completed / steps.length) * 100,
  )
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

function formatDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Ei tiedossa"
  }

  return new Intl.DateTimeFormat(
    "fi-FI",
  ).format(date)
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-500"

export default Projects