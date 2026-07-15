import { useMemo, useState } from "react"

const API_URL = "http://localhost:3001/api"

function CostCalculator({
  project,
  onProjectUpdated,
}) {
  const [form, setForm] = useState({
    laborHours: String(project?.laborHours ?? 0),
    hourlyRate: String(project?.hourlyRate ?? 55),
    otherCosts: String(project?.otherCosts ?? 0),
    markupPercent: String(
      project?.markupPercent ?? 40,
    ),
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const materialTotal = useMemo(() => {
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
  }, [project?.materials])

  const laborTotal =
    toNumber(form.laborHours) *
    toNumber(form.hourlyRate)

  const otherCosts = toNumber(form.otherCosts)

  const productionCost =
    materialTotal + laborTotal + otherCosts

  const markupPercent = toNumber(
    form.markupPercent,
  )

  const estimatedProfit =
    productionCost * (markupPercent / 100)

  const recommendedPrice =
    productionCost + estimatedProfit

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

    const payload = {
      laborHours: toNumber(form.laborHours),
      hourlyRate: toNumber(form.hourlyRate),
      otherCosts: toNumber(form.otherCosts),
      markupPercent: toNumber(
        form.markupPercent,
      ),
    }

    const hasInvalidValue = Object.values(
      payload,
    ).some(
      (value) =>
        !Number.isFinite(value) || value < 0,
    )

    if (hasInvalidValue) {
      setError(
        "Tarkista, että kaikki arvot ovat vähintään 0.",
      )
      return
    }

    try {
      setSaving(true)
      setSaved(false)
      setError("")

      const response = await fetch(
        `${API_URL}/projects/${project.id}/costing`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Kustannuslaskelman tallennus epäonnistui",
        )
      }

      onProjectUpdated?.(data)
      setSaved(true)
    } catch (saveError) {
      console.error(saveError)
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Cost calculator
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Kustannuslaskuri
        </h2>

        <p className="mt-2 text-neutral-400">
          Lisää työaika, tuntihinta, muut kulut ja
          tavoiteltu kate.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <FormField label="Työtunnit">
            <input
              type="number"
              name="laborHours"
              value={form.laborHours}
              onChange={handleChange}
              min="0"
              step="0.25"
              className={inputClasses}
            />
          </FormField>

          <FormField label="Tuntihinta €/h">
            <input
              type="number"
              name="hourlyRate"
              value={form.hourlyRate}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={inputClasses}
            />
          </FormField>

          <FormField label="Muut kulut €">
            <input
              type="number"
              name="otherCosts"
              value={form.otherCosts}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={inputClasses}
            />
          </FormField>

          <FormField label="Kate %">
            <input
              type="number"
              name="markupPercent"
              value={form.markupPercent}
              onChange={handleChange}
              min="0"
              step="1"
              className={inputClasses}
            />
          </FormField>

          {error && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Tallennetaan..."
              : "Tallenna laskelma"}
          </button>

          {saved && (
            <p className="text-center text-sm text-green-400">
              ✓ Kustannuslaskelma tallennettu
            </p>
          )}
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Project pricing
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Projektin hinnoittelu
        </h2>

        <div className="mt-6 space-y-3">
          <PriceRow
            label="Materiaalit"
            value={materialTotal}
          />

          <PriceRow
            label="Työ"
            value={laborTotal}
          />

          <PriceRow
            label="Muut kulut"
            value={otherCosts}
          />

          <div className="my-4 border-t border-neutral-800" />

          <PriceRow
            label="Tuotantokustannus"
            value={productionCost}
            strong
          />

          <PriceRow
            label={`Kate ${markupPercent} %`}
            value={estimatedProfit}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <p className="text-sm text-neutral-400">
            Suositeltu myyntihinta
          </p>

          <p className="mt-2 text-4xl font-bold text-amber-400">
            {formatCurrency(recommendedPrice)}
          </p>
        </div>
      </section>
    </div>
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

function PriceRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "font-semibold text-neutral-200"
            : "text-neutral-400"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-lg font-bold text-neutral-100"
            : "font-medium text-neutral-200"
        }
      >
        {formatCurrency(value)}
      </span>
    </div>
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

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-500"

export default CostCalculator