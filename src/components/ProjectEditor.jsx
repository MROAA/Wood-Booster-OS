import { useEffect, useState } from "react"

const API_URL = "http://localhost:3001/api"

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
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

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

      const response = await fetch(
        `${API_URL}/projects/${project.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            status: form.status,
            deadline: form.deadline || null,
            description:
              form.description.trim() || null,
            notes: form.notes.trim() || null,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Projektin päivittäminen epäonnistui",
        )
      }

      setForm({
        name: data.name || "",
        status: data.status || "Suunnittelu",
        deadline: formatDateInput(data.deadline),
        description: data.description || "",
        notes: data.notes || "",
      })

      onProjectUpdated?.(data)
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
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <p className="text-xs uppercase tracking-wider text-neutral-500">
        Project settings
      </p>

      <h3 className="mt-2 text-2xl font-semibold">
        Muokkaa projektia
      </h3>

      <p className="mt-2 text-neutral-400">
        Päivitä projektin perustiedot, tila,
        deadline ja muistiinpanot.
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

          <FormField label="Asiakas">
            <input
              type="text"
              value={
                project?.customer?.name ||
                "Ei asiakasta"
              }
              readOnly
              className={`${inputClasses} cursor-not-allowed opacity-70`}
            />
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
              className={`${inputClasses} resize-y`}
            />
          </FormField>
        </div>

        <div className="mt-5">
          <FormField label="Muistiinpanot">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={5}
              placeholder="Projektin sisäiset muistiinpanot..."
              className={`${inputClasses} resize-y`}
            />
          </FormField>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
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
      <span className="text-sm text-neutral-300">
        {label}
      </span>

      {children}
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

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-500"

export default ProjectEditor
