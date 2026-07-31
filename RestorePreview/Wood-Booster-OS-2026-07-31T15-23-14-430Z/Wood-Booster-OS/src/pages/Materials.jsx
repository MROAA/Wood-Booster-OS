import { useState } from "react"
import {
  createMaterial,
  getMaterials,
} from "../data/MaterialStore"

function Materials() {
  const [materials, setMaterials] = useState(() =>
    getMaterials(),
  )

  const [form, setForm] = useState({
    name: "",
    category: "Puu",
    unit: "kpl",
    unitPrice: "",
    stock: "",
    supplier: "",
  })

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      return
    }

    const material = createMaterial(form)

    setMaterials((current) => [
      ...current,
      material,
    ])

    setForm({
      name: "",
      category: "Puu",
      unit: "kpl",
      unitPrice: "",
      stock: "",
      supplier: "",
    })
  }

  return (
    <div>
      <h1 className="text-4xl font-bold">
        🪵 Materiaalikirjasto
      </h1>

      <p className="mt-2 text-neutral-400">
        Hallitse puutavaraa, epoksia,
        pintakäsittelyaineita ja muita materiaaleja.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:grid-cols-2"
      >
        <input
          name="name"
          placeholder="Materiaali"
          value={form.name}
          onChange={handleChange}
          className={inputClasses}
        />

        <input
          name="category"
          placeholder="Kategoria"
          value={form.category}
          onChange={handleChange}
          className={inputClasses}
        />

        <input
          name="unit"
          placeholder="Yksikkö"
          value={form.unit}
          onChange={handleChange}
          className={inputClasses}
        />

        <input
          type="number"
          name="unitPrice"
          placeholder="€/yksikkö"
          value={form.unitPrice}
          onChange={handleChange}
          className={inputClasses}
        />

        <input
          type="number"
          name="stock"
          placeholder="Varastossa"
          value={form.stock}
          onChange={handleChange}
          className={inputClasses}
        />

        <input
          name="supplier"
          placeholder="Toimittaja"
          value={form.supplier}
          onChange={handleChange}
          className={inputClasses}
        />

        <button
          type="submit"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 hover:bg-amber-400 md:col-span-2"
        >
          + Lisää materiaali
        </button>
      </form>

      <div className="mt-8 grid gap-4">
        {materials.map((material) => (
          <article
            key={material.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {material.name}
              </h2>

              <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm">
                {material.category}
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-neutral-400 md:grid-cols-4">
              <p>
                <strong>Hinta:</strong>{" "}
                {material.unitPrice} €
              </p>

              <p>
                <strong>Yksikkö:</strong>{" "}
                {material.unit}
              </p>

              <p>
                <strong>Varasto:</strong>{" "}
                {material.stock}
              </p>

              <p>
                <strong>Toimittaja:</strong>{" "}
                {material.supplier || "-"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

const inputClasses =
  "rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-500"

export default Materials