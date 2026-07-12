import { useMemo } from "react"
import { getMaterials } from "../data/MaterialStore"

function MaterialsTab({ project }) {
  const materials = useMemo(() => getMaterials(), [])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Material Library
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Materiaalikirjasto
        </h2>

        <div className="mt-6 space-y-3">
          {materials.length === 0 ? (
            <p className="text-neutral-500">
              Ei materiaaleja.
            </p>
          ) : (
            materials.map((material) => (
              <div
                key={material.id}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {material.name}
                  </h3>

                  <span className="text-sm text-neutral-400">
                    {material.unitPrice} € / {material.unit}
                  </span>
                </div>

                <p className="mt-2 text-sm text-neutral-500">
                  Varastossa {material.stock} {material.unit}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Project Materials
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Projektin materiaalit
        </h2>

        <div className="mt-8 rounded-xl border border-dashed border-neutral-700 p-8 text-center">
          <p className="text-5xl">🪵</p>

          <h3 className="mt-4 text-xl font-semibold">
            Tulossa seuraavassa vaiheessa
          </h3>

          <p className="mt-2 text-neutral-400">
            Tähän lisätään projektin materiaalit ja
            kustannuslaskenta.
          </p>
        </div>
      </section>
    </div>
  )
}

export default MaterialsTab