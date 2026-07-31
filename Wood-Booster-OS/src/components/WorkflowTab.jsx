import { useEffect, useMemo, useState } from "react"

const API_URL = "http://localhost:3001/api"

const columns = [
  {
    id: "planning",
    title: "Suunnittelu",
    icon: "📋",
  },
  {
    id: "materials",
    title: "Materiaalit",
    icon: "🪵",
  },
  {
    id: "production",
    title: "Valmistus",
    icon: "🛠️",
  },
  {
    id: "finishing",
    title: "Viimeistely",
    icon: "✨",
  },
  {
    id: "delivery",
    title: "Toimitus",
    icon: "🚚",
  },
]

function WorkflowTab({ projectId }) {
  const [workflow, setWorkflow] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    title: "",
    columnId: "planning",
  })

  useEffect(() => {
    async function loadWorkflow() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(
          `${API_URL}/projects/${projectId}/workflow`,
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Työvaiheiden lataaminen epäonnistui",
          )
        }

        setWorkflow(
          Array.isArray(data) ? data : [],
        )
      } catch (loadError) {
        console.error(loadError)
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadWorkflow()
    }
  }, [projectId])

  const progress = useMemo(() => {
    if (workflow.length === 0) {
      return 0
    }

    const completedSteps = workflow.filter(
      (step) => step.done,
    ).length

    return Math.round(
      (completedSteps / workflow.length) * 100,
    )
  }, [workflow])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function addStep(event) {
    event.preventDefault()

    const title = form.title.trim()

    if (!title) {
      setError("Kirjoita työvaiheen nimi.")
      return
    }

    try {
      setSaving(true)
      setError("")

      const response = await fetch(
        `${API_URL}/workflow`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            columnId: form.columnId,
            projectId: Number(projectId),
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Työvaiheen lisääminen epäonnistui",
        )
      }

      setWorkflow((current) => [
        ...current,
        data,
      ])

      setForm({
        title: "",
        columnId: "planning",
      })
    } catch (saveError) {
      console.error(saveError)
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStep(stepId, changes) {
    try {
      setError("")

      const response = await fetch(
        `${API_URL}/workflow/${stepId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changes),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Työvaiheen päivittäminen epäonnistui",
        )
      }

      setWorkflow((current) =>
        current.map((step) =>
          step.id === stepId ? data : step,
        ),
      )
    } catch (updateError) {
      console.error(updateError)
      setError(updateError.message)
    }
  }

  function toggleStep(step) {
    updateStep(step.id, {
      done: !step.done,
    })
  }

  function moveStep(stepId, columnId) {
    updateStep(stepId, {
      columnId,
    })
  }

  async function deleteStep(step) {
    const shouldDelete = window.confirm(
      `Poistetaanko työvaihe "${step.title}"?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      setError("")

      const response = await fetch(
        `${API_URL}/workflow/${step.id}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Työvaiheen poistaminen epäonnistui",
        )
      }

      setWorkflow((current) =>
        current.filter(
          (item) => item.id !== step.id,
        ),
      )
    } catch (deleteError) {
      console.error(deleteError)
      setError(deleteError.message)
    }
  }

  return (
    <div>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Production workflow
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Tuotannon työvaiheet
            </h2>

            <p className="mt-2 text-neutral-400">
              Lisää työvaiheita ja siirrä niitä
              tuotannon edetessä.
            </p>
          </div>

          <span className="rounded-full bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-400">
            {progress} % valmis
          </span>
        </div>

        <div className="mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <form
          onSubmit={addStep}
          className="mt-6 grid gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 md:grid-cols-[1fr_220px_auto]"
        >
          <label className="block">
            <span className="text-sm text-neutral-300">
              Uusi työvaihe
            </span>

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Esimerkiksi epoksivalu"
              className={inputClasses}
            />
          </label>

          <label className="block">
            <span className="text-sm text-neutral-300">
              Sarake
            </span>

            <select
              name="columnId"
              value={form.columnId}
              onChange={handleChange}
              className={inputClasses}
            >
              {columns.map((column) => (
                <option
                  key={column.id}
                  value={column.id}
                >
                  {column.icon} {column.title}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="self-end rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Lisätään..." : "+ Lisää"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </section>

      {loading ? (
        <p className="mt-6 text-neutral-400">
          Ladataan työvaiheita...
        </p>
      ) : (
        <section className="mt-6 overflow-x-auto">
          <div className="grid min-w-[1180px] grid-cols-5 gap-4">
            {columns.map((column) => {
              const columnSteps = workflow.filter(
                (step) =>
                  step.columnId === column.id,
              )

              return (
                <article
                  key={column.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xl">
                        {column.icon}
                      </p>

                      <h3 className="mt-2 font-semibold">
                        {column.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                      {columnSteps.length}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {columnSteps.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-neutral-700 p-5 text-center text-sm text-neutral-500">
                        Ei työvaiheita
                      </div>
                    ) : (
                      columnSteps.map((step) => (
                        <WorkflowCard
                          key={step.id}
                          step={step}
                          onToggle={toggleStep}
                          onMove={moveStep}
                          onDelete={deleteStep}
                        />
                      ))
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function WorkflowCard({
  step,
  onToggle,
  onMove,
  onDelete,
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        step.done
          ? "border-green-900/60 bg-green-950/10"
          : "border-neutral-800 bg-neutral-950"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(step)}
        className="flex w-full items-start gap-3 text-left"
      >
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
            step.done
              ? "border-green-500 bg-green-500 text-neutral-950"
              : "border-neutral-600 text-transparent"
          }`}
        >
          ✓
        </span>

        <span
          className={`min-w-0 flex-1 font-medium ${
            step.done
              ? "text-neutral-500 line-through"
              : "text-neutral-200"
          }`}
        >
          {step.title}
        </span>
      </button>

      <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-neutral-600">
            Siirrä vaiheeseen
          </span>

          <select
            value={step.columnId}
            onChange={(event) =>
              onMove(
                step.id,
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          >
            {columns.map((column) => (
              <option
                key={column.id}
                value={column.id}
              >
                {column.icon} {column.title}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onDelete(step)}
          className="w-full rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
        >
          Poista
        </button>
      </div>
    </div>
  )
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"

export default WorkflowTab