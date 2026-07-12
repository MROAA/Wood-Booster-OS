import { useMemo, useState } from "react"
import { getMaterials } from "../data/MaterialStore"

function MaterialsTab({
  project,
  onProjectUpdated,
}) {
  const materialLibrary = useMemo(
    () => getMaterials(),
    [],
  )

  const [projectMaterials, setProjectMaterials] =
    useState(() =>
      Array.isArray(project?.materials)
        ? project.materials
        : [],
    )

  const [form, setForm] = useState({
    materialId: "",
    quantity: "1",
  })

  function handleChange(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  function addMaterial(event) {
    event.preventDefault()

    const selectedMaterial = materialLibrary.find(
      (material) =>
        String(material.id) ===
        String(form.materialId),
    )

    const quantity = Number(form.quantity)

    if (
      !selectedMaterial ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return
    }

    const existingMaterial = projectMaterials.find(
      (material) =>
        String(material.materialId) ===
        String(selectedMaterial.id),
    )

    let updatedMaterials

    if (existingMaterial) {
      updatedMaterials = projectMaterials.map(
        (material) => {
          if (
            String(material.materialId) !==
            String(selectedMaterial.id)
          ) {
            return material
          }

          return {
            ...material,
            quantity:
              toNumber(material.quantity) + quantity,
          }
        },
      )
    } else {
      const newMaterial = {
        id: createId(),
        materialId: selectedMaterial.id,
        name: selectedMaterial.name,
        category: selectedMaterial.category,
        unit: selectedMaterial.unit,
        unitPrice: toNumber(
          selectedMaterial.unitPrice,
        ),
        quantity,
        createdAt: new Date().toISOString(),
      }

      updatedMaterials = [
        ...projectMaterials,
        newMaterial,
      ]
    }

    saveProjectMaterials(updatedMaterials)

    setForm({
      materialId: "",
      quantity: "1",
    })
  }

  function deleteMaterial(materialId) {
    const shouldDelete = window.confirm(
      "Poistetaanko materiaali projektilta?",
    )

    if (!shouldDelete) {
      return
    }

    const updatedMaterials =
      projectMaterials.filter(
        (material) =>
          String(material.id) !==
          String(materialId),
      )

    saveProjectMaterials(updatedMaterials)
  }

  function saveProjectMaterials(updatedMaterials) {
    setProjectMaterials(updatedMaterials)

    const projects = readProjects()

    const updatedProjects = projects.map(
      (currentProject) => {
        if (
          String(currentProject.id) !==
          String(project.id)
        ) {
          return currentProject
        }

        return {
          ...currentProject,
          materials: updatedMaterials,
          updatedAt: new Date().toISOString(),
        }
      },
    )

    localStorage.setItem(
      "woodBoosterProjects",
      JSON.stringify(updatedProjects),
    )

    const updatedProject = updatedProjects.find(
      (currentProject) =>
        String(currentProject.id) ===
        String(project.id),
    )

    onProjectUpdated?.(
      updatedProject,
      updatedProjects,
    )
  }

  const materialTotal = projectMaterials.reduce(
    (sum, material) =>
      sum +
      toNumber(material.quantity) *
        toNumber(material.unitPrice),
    0,
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Add material
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Lisää materiaali projektiin
        </h2>

        <p className="mt-2 text-neutral-400">
          Valitse materiaali kirjastosta ja anna tarvittava
          määrä.
        </p>

        <form
          onSubmit={addMaterial}
          className="mt-6 space-y-5"
        >
          <label className="block">
            <span className="text-sm text-neutral-300">
              Materiaali
            </span>

            <select
              name="materialId"
              value={form.materialId}
              onChange={handleChange}
              required
              className={inputClasses}
            >
              <option value="">
                Valitse materiaali
              </option>

              {materialLibrary.map((material) => (
                <option
                  key={material.id}
                  value={material.id}
                >
                  {material.name} –{" "}
                  {formatCurrency(
                    material.unitPrice,
                  )}{" "}
                  / {material.unit}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-neutral-300">
              Määrä
            </span>

            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
              className={inputClasses}
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            + Lisää projektiin
          </button>
        </form>

        {materialLibrary.length === 0 && (
          <p className="mt-5 text-sm text-amber-400">
            Materiaalikirjasto on tyhjä. Lisää ensin
            materiaaleja Materiaalit-sivulla.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Project materials
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Projektin materiaalit
            </h2>
          </div>

          <span className="rounded-full bg-amber-500/10 px-3 py-1 font-semibold text-amber-400">
            {formatCurrency(materialTotal)}
          </span>
        </div>

        {projectMaterials.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-8 text-center">
            <p className="text-5xl">🪵</p>

            <h3 className="mt-4 text-xl font-semibold">
              Ei materiaaleja vielä
            </h3>

            <p className="mt-2 text-neutral-400">
              Valitse ensimmäinen materiaali vasemmalla
              olevasta lomakkeesta.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {projectMaterials.map((material) => {
              const rowTotal =
                toNumber(material.quantity) *
                toNumber(material.unitPrice)

              return (
                <article
                  key={material.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-100">
                        {material.name ||
                          "Nimetön materiaali"}
                      </h3>

                      <p className="mt-1 text-sm text-neutral-500">
                        {material.quantity}{" "}
                        {material.unit || "kpl"} ×{" "}
                        {formatCurrency(
                          material.unitPrice,
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="font-semibold text-amber-400">
                        {formatCurrency(rowTotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          deleteMaterial(material.id)
                        }
                        className="rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                      >
                        Poista
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}

            <div className="flex items-center justify-between border-t border-neutral-800 pt-5">
              <span className="font-semibold text-neutral-300">
                Materiaalit yhteensä
              </span>

              <span className="text-2xl font-bold text-amber-400">
                {formatCurrency(materialTotal)}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
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

export default MaterialsTab