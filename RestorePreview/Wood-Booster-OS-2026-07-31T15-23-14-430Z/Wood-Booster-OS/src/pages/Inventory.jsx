import { useEffect, useMemo, useState } from "react"

const API_URL = "http://localhost:3001/api/inventory"

const emptyForm = {
  name: "",
  category: "Puu",
  quantity: "",
  unit: "kpl",
  minimumStock: "",
  unitPrice: "",
  supplier: "",
  notes: "",
}

function Inventory() {
  const [items, setItems] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingItemId, setEditingItemId] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadInventory()
  }, [])

  async function loadInventory() {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(API_URL)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Varaston lataaminen epäonnistui",
        )
      }

      setItems(Array.isArray(data) ? data : [])
    } catch (loadError) {
      console.error(loadError)
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const sortedItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...items]
      .filter((item) => {
        if (!query) {
          return true
        }

        return [
          item.name,
          item.category,
          item.supplier,
          item.notes,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        )
      })
      .sort((first, second) =>
        first.name.localeCompare(second.name, "fi"),
      )
  }, [items, search])

  const lowStockItems = items.filter(
    (item) =>
      toNumber(item.minimumStock) > 0 &&
      toNumber(item.quantity) <=
        toNumber(item.minimumStock),
  )

  const inventoryValue = items.reduce(
    (sum, item) =>
      sum +
      toNumber(item.quantity) *
        toNumber(item.unitPrice),
    0,
  )

  const isEditing = editingItemId !== null

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setError("")
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const name = formData.name.trim()

    if (!name) {
      setError("Materiaalin nimi puuttuu.")
      return
    }

    const payload = {
      name,
      category:
        formData.category.trim() || "Muut",
      quantity: toNumber(formData.quantity),
      unit: formData.unit.trim() || "kpl",
      minimumStock: toNumber(
        formData.minimumStock,
      ),
      unitPrice: toNumber(formData.unitPrice),
      supplier:
        formData.supplier.trim() || null,
      notes: formData.notes.trim() || null,
    }

    try {
      setSaving(true)
      setError("")

      const response = await fetch(
        isEditing
          ? `${API_URL}/${editingItemId}`
          : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
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
            "Varastotuotteen tallentaminen epäonnistui",
        )
      }

      if (isEditing) {
        setItems((current) =>
          current.map((item) =>
            item.id === editingItemId
              ? data
              : item,
          ),
        )
      } else {
        setItems((current) => [
          ...current,
          data,
        ])
      }

      resetForm()
    } catch (saveError) {
      console.error(saveError)
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(item) {
    setEditingItemId(item.id)

    setFormData({
      name: item.name || "",
      category: item.category || "Muut",
      quantity: String(item.quantity ?? ""),
      unit: item.unit || "kpl",
      minimumStock: String(
        item.minimumStock ?? "",
      ),
      unitPrice: String(item.unitPrice ?? ""),
      supplier: item.supplier || "",
      notes: item.notes || "",
    })

    setError("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  async function handleDelete(item) {
    const shouldDelete = window.confirm(
      `Poistetaanko materiaali "${item.name}"?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      setError("")

      const response = await fetch(
        `${API_URL}/${item.id}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Varastotuotteen poistaminen epäonnistui",
        )
      }

      setItems((current) =>
        current.filter(
          (currentItem) =>
            currentItem.id !== item.id,
        ),
      )

      if (editingItemId === item.id) {
        resetForm()
      }
    } catch (deleteError) {
      console.error(deleteError)
      setError(deleteError.message)
    }
  }

  function resetForm() {
    setFormData(emptyForm)
    setEditingItemId(null)
    setError("")
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
            Wood-Booster Inventory
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Varasto
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-400">
            Seuraa puuta, epoksia,
            pintakäsittelyaineita ja muita
            verstaan materiaaleja.
          </p>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Materiaalit"
            value={String(items.length)}
            detail="Varastossa olevat nimikkeet"
          />

          <SummaryCard
            label="Varaston arvo"
            value={formatCurrency(inventoryValue)}
            detail="Määrä × yksikköhinta"
          />

          <SummaryCard
            label="Täydennettävää"
            value={String(lowStockItems.length)}
            detail="Alarajalla tai sen alla"
            warning={lowStockItems.length > 0}
          />
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.5fr]">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              {isEditing
                ? "Edit material"
                : "New material"}
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              {isEditing
                ? "Muokkaa materiaalia"
                : "Lisää materiaali"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              <FormField
                label="Materiaalin nimi"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <SelectField
                label="Kategoria"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={[
                  "Puu",
                  "Epoksi",
                  "Pintakäsittely",
                  "Kiinnikkeet",
                  "Pakkaus",
                  "Muut",
                ]}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Määrä"
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                />

                <FormField
                  label="Yksikkö"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="kg, l, m², kpl..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Hälytysraja"
                  name="minimumStock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumStock}
                  onChange={handleChange}
                />

                <FormField
                  label="Yksikköhinta €"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={handleChange}
                />
              </div>

              <FormField
                label="Toimittaja"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
              />

              <label className="block">
                <span className="text-sm text-neutral-300">
                  Muistiinpanot
                </span>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className={inputClasses}
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Tallennetaan..."
                  : isEditing
                    ? "Tallenna muutokset"
                    : "Tallenna materiaali"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-xl border border-neutral-700 px-5 py-3 font-semibold text-neutral-300 transition hover:bg-neutral-800"
                >
                  Peruuta muokkaus
                </button>
              )}
            </form>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Stock register
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Varastolista
                </h2>
              </div>

              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-400">
                {items.length} nimikettä
              </span>
            </div>

            <label className="mt-6 block">
              <span className="text-sm text-neutral-300">
                Hae varastosta
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Hae nimellä, kategorialla tai toimittajalla..."
                className={inputClasses}
              />
            </label>

            {loading ? (
              <p className="mt-6 text-neutral-400">
                Ladataan varastoa...
              </p>
            ) : sortedItems.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-10 text-center">
                <p className="text-4xl">📦</p>

                <h3 className="mt-4 text-lg font-semibold">
                  {items.length === 0
                    ? "Varasto on vielä tyhjä"
                    : "Hakuehdoilla ei löytynyt tuotteita"}
                </h3>

                <p className="mt-2 text-neutral-400">
                  {items.length === 0
                    ? "Lisää ensimmäinen materiaali vasemmalla olevalla lomakkeella."
                    : "Kokeile toista hakusanaa."}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {sortedItems.map((item) => {
                  const isLow =
                    toNumber(item.minimumStock) > 0 &&
                    toNumber(item.quantity) <=
                      toNumber(item.minimumStock)

                  return (
                    <article
                      key={item.id}
                      className={`rounded-xl border bg-neutral-950 p-5 ${
                        isLow
                          ? "border-red-900/70"
                          : "border-neutral-800"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              {item.name}
                            </h3>

                            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                              {item.category}
                            </span>

                            {isLow && (
                              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                                Täydennä
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-2xl font-bold text-amber-400">
                            {formatNumber(item.quantity)}{" "}
                            <span className="text-base font-medium text-neutral-400">
                              {item.unit}
                            </span>
                          </p>

                          <div className="mt-3 space-y-1 text-sm text-neutral-500">
                            <p>
                              Hälytysraja:{" "}
                              {formatNumber(
                                item.minimumStock,
                              )}{" "}
                              {item.unit}
                            </p>

                            <p>
                              Yksikköhinta:{" "}
                              {formatCurrency(
                                item.unitPrice,
                              )}
                            </p>

                            <p>
                              Arvo:{" "}
                              {formatCurrency(
                                toNumber(item.quantity) *
                                  toNumber(
                                    item.unitPrice,
                                  ),
                              )}
                            </p>

                            {item.supplier && (
                              <p>
                                Toimittaja:{" "}
                                {item.supplier}
                              </p>
                            )}
                          </div>

                          {item.notes && (
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(item)
                            }
                            className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 transition hover:border-amber-500 hover:text-amber-400"
                          >
                            Muokkaa
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(item)
                            }
                            className="rounded-lg border border-red-950 px-3 py-2 text-sm text-red-400 transition hover:border-red-700 hover:bg-red-950/40"
                          >
                            Poista
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
  detail,
  warning = false,
}) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        warning
          ? "border-red-900/60 bg-red-950/10"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <p className="text-sm text-neutral-400">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${
          warning
            ? "text-red-400"
            : "text-neutral-100"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-neutral-500">
        {detail}
      </p>
    </article>
  )
}

function FormField({
  label,
  name,
  type = "text",
  min,
  step,
  value,
  onChange,
  required = false,
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-300">
        {label}
      </span>

      <input
        name={name}
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={inputClasses}
      />
    </label>
  )
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-300">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className={inputClasses}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(toNumber(value))
}

function formatNumber(value) {
  return new Intl.NumberFormat("fi-FI", {
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"

export default Inventory
