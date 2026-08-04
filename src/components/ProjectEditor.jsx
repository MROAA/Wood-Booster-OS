import { useEffect, useState } from "react"

import { apiGet, apiPut } from "../api/client"

function ProjectEditor({
  project,
  onProjectUpdated,
}) {
  const [form, setForm] = useState({
    name: "",
    status: "Suunnittelu",
    deadline: "",
    description: "",
    notes: "",
    customerId: "",
  })

  const [customers, setCustomers] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    apiGet("/customers")
      .then(setCustomers)
      .catch((loadError) => {
        console.error(
          "Asiakkaiden haku epäonnistui:",
          loadError,
        )
      })
  }, [])

  useEffect(() => {
    if (!project) {
      return
    }

    setForm({
      name: project.name || "",
      status: project.status || "Suunnittelu",
      deadline: formatDateInput(project.deadline),
      description: project.description || "",
      notes: project.notes || "",
      customerId:
        project.customerId ??
        project.customer?.id ??
        "",
    })

    setSaved(false)
    setError("")
  }, [project?.id])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setSaved(false)
    setError("")
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!project?.id) {
      setError("Projektin tunniste puuttuu.")
      return
    }

    const name = form.name.trim()

    if (!name) {
      setError("Projektin nimi puuttuu.")
      return
    }

    try {
      setSaving(true)
      setSaved(false)
      setError("")

      const data = await apiPut(
        `/projects/${project.id}`,
        {
          name,
          status: form.status,
          deadline: form.deadline || null,
          description:
            form.description.trim() || null,
          notes: form.notes.trim() || null,
          customerId: form.customerId || null,
        },
      )

      const updatedProject = data.project

      setForm({
        name: updatedProject.name || "",
        status:
          updatedProject.status ||
          "Suunnittelu",
        deadline: formatDateInput(
          updatedProject.deadline,
        ),
        description:
          updatedProject.description || "",
        notes: updatedProject.notes || "",
        customerId:
          updatedProject.customerId ??
          updatedProject.customer?.id ??
          "",
      })

      onProjectUpdated?.(updatedProject)
      setSaved(true)
    } catch (saveError) {
      console.error(
        "Projektin tallennus epäonnistui:",
        saveError,
      )

      setError(
        saveError.message ||
          "Projektin päivittäminen epäonnistui",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card p-6">
      <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
        Project settings
      </p>

      <h3 className="mt-2 text-2xl font-semibold">
        Muokkaa projektia
      </h3>

      <p className="mt-2 text-[var(--wood-muted)]">
        Päivitä projektin perustiedot, tila,
        deadline ja asiakas.
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
              className="wb-input"
            />
          </FormField>

          <FormField label="Projektin tila">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="wb-input"
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
              className="wb-input"
            />
          </FormField>

          <FormField label="Asiakas">
            <select
              name="customerId"
              value={form.customerId}
              onChange={handleChange}
              className="wb-input"
            >
              <option value="">
                Ei asiakasta
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="mt-5">
          <FormField label="Projektin kuvaus">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Kuvaile tuotetta, asiakkaan toiveita ja projektin tavoitetta..."
              className="wb-input resize-y"
            />
          </FormField>
        </div>

        <div className="mt-5">
          <FormField label="Yleiset muistiinpanot (näkyvät myös Yhteenveto-välilehdellä)">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={5}
              placeholder="Projektin sisäiset muistiinpanot..."
              className="wb-input resize-y"
            />
          </FormField>
        </div>

        {error && (
          <div className="mt-5 card border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="wb-button disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Tallennetaan..."
              : "Tallenna muutokset"}
          </button>

          {saved && (
            <span className="text-sm font-medium text-green-400">
              ✓ Muutokset tallennettu tietokantaan
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
      <span className="text-sm text-[var(--wood-muted)]">
        {label}
      </span>

      <div className="mt-2">
        {children}
      </div>
    </label>
  )
}

function formatDateInput(value) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toISOString().slice(0, 10)
}

export default ProjectEditor
