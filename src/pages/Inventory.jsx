import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client"



const emptyMaterial = {

  name: "",
  category: "",
  quantity: "",
  unit: "kpl",
  unitPrice: "",
  minStock: "",
  supplier: "",
  notes: "",

}



function Inventory() {


  const [
    materials,
    setMaterials,
  ] = useState([])


  const [
    form,
    setForm,
  ] = useState(emptyMaterial)


  const [
    showForm,
    setShowForm,
  ] = useState(false)


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    error,
    setError,
  ] = useState(null)


  const [
    editingId,
    setEditingId,
  ] = useState(null)


  const [
    editForm,
    setEditForm,
  ] = useState(emptyMaterial)





  async function loadMaterials() {

    try {

      setLoading(true)

      const data =
        await apiGet("/inventory")


      setMaterials(data)


    } catch (error) {

      setError(
        error.message,
      )

    } finally {

      setLoading(false)

    }

  }





  useEffect(() => {

    loadMaterials()

  }, [])






  async function createMaterial() {


    if (
      !form.name.trim()
    ) {

      return

    }


    try {


      const material =
        await apiPost(
          "/inventory",
          {

            name:
              form.name,

            category:
              form.category,

            quantity:
              Number(
                form.quantity || 0,
              ),

            unit:
              form.unit,

            unitPrice:
              Number(
                form.unitPrice || 0,
              ),

            minStock:
              form.minStock === ""
                ? null
                : Number(
                    form.minStock,
                  ),

            supplier:
              form.supplier,

            notes:
              form.notes,

          },
        )



      setMaterials(
        previous => [
          material,
          ...previous,
        ],
      )


      setForm(emptyMaterial)

      setShowForm(false)


    } catch (error) {

      setError(
        error.message,
      )

    }


  }




  function startEdit(
    material,
  ) {

    setEditingId(
      material.id,
    )


    setEditForm({

      name:
        material.name || "",

      category:
        material.category || "",

      quantity:
        String(
          material.quantity ?? "",
        ),

      unit:
        material.unit || "kpl",

      unitPrice:
        String(
          material.unitPrice ?? "",
        ),

      minStock:
        material.minStock === null ||
        material.minStock === undefined
          ? ""
          : String(
              material.minStock,
            ),

      supplier:
        material.supplier || "",

      notes:
        material.notes || "",

    })

  }




  function cancelEdit() {

    setEditingId(null)

  }




  function updateEditField(
    field,
    value,
  ) {

    setEditForm(

      previous => ({

        ...previous,

        [field]:
          value,

      })

    )

  }




  async function saveEdit() {


    if (
      !editForm.name.trim()
    ) {

      return

    }


    try {

      const updated =
        await apiPut(
          `/inventory/${editingId}`,
          {

            name:
              editForm.name,

            category:
              editForm.category,

            quantity:
              Number(
                editForm.quantity || 0,
              ),

            unit:
              editForm.unit,

            unitPrice:
              Number(
                editForm.unitPrice || 0,
              ),

            minStock:
              editForm.minStock === ""
                ? null
                : Number(
                    editForm.minStock,
                  ),

            supplier:
              editForm.supplier,

            notes:
              editForm.notes,

          },
        )


      setMaterials(

        previous =>
          previous.map(
            material =>
              material.id === updated.id
                ? updated
                : material,
          )

      )


      setEditingId(null)


    } catch (error) {

      setError(
        error.message,
      )

    }


  }




  async function deleteMaterial(
    id,
  ) {


    const shouldDelete =
      window.confirm(
        "Poistetaanko materiaali?",
      )


    if (!shouldDelete) {

      return

    }


    try {

      await apiDelete(
        `/inventory/${id}`,
      )


      setMaterials(

        previous =>
          previous.filter(
            material =>
              material.id !== id,
          )

      )


    } catch (error) {

      setError(
        error.message,
      )

    }


  }






  function updateField(
    field,
    value,
  ) {

    setForm(
      previous => ({

        ...previous,

        [field]:
          value,

      })
    )

  }






  return (

    <div
      className="
        space-y-8
      "
    >


      <section
        className="
          flex
          items-start
          justify-between
        "
      >

        <div>

          <h1
            className="
              page-title
            "
          >
            Materiaalit
          </h1>


          <p
            className="
              page-description
            "
          >
            Materiaalikirjasto Wood-Booster OS:ssa.
          </p>


        </div>



        <button

          className="
            wb-button
          "

          onClick={() =>
            setShowForm(
              !showForm
            )
          }

        >
          + Uusi materiaali

        </button>


      </section>







      {
        showForm && (

          <section
            className="
              panel
              max-w-xl
              space-y-4
            "
          >

            <h2
              className="
                text-lg
                font-semibold
              "
            >
              Lisää materiaali
            </h2>



            <input
              className="wb-input"
              placeholder="Materiaalin nimi"
              value={form.name}
              onChange={
                e =>
                  updateField(
                    "name",
                    e.target.value
                  )
              }
            />



            <input
              className="wb-input"
              placeholder="Kategoria"
              value={form.category}
              onChange={
                e =>
                  updateField(
                    "category",
                    e.target.value
                  )
              }
            />



            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >

              <input
                className="wb-input"
                placeholder="Määrä"
                value={form.quantity}
                onChange={
                  e =>
                    updateField(
                      "quantity",
                      e.target.value
                    )
                }
              />


              <input
                className="wb-input"
                placeholder="Yksikkö"
                value={form.unit}
                onChange={
                  e =>
                    updateField(
                      "unit",
                      e.target.value
                    )
                }
              />

            </div>



            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >

              <input
                className="wb-input"
                placeholder="Hinta (€)"
                value={form.unitPrice}
                onChange={
                  e =>
                    updateField(
                      "unitPrice",
                      e.target.value
                    )
                }
              />


              <input
                className="wb-input"
                placeholder="Toimittaja"
                value={form.supplier}
                onChange={
                  e =>
                    updateField(
                      "supplier",
                      e.target.value
                    )
                }
              />

            </div>



            <input
              className="wb-input"
              placeholder="Hälytysraja (väh. määrä, valinnainen)"
              value={form.minStock}
              onChange={
                e =>
                  updateField(
                    "minStock",
                    e.target.value
                  )
              }
            />



            <textarea
              className="wb-input"
              placeholder="Muistiinpanot"
              rows="4"
              value={form.notes}
              onChange={
                e =>
                  updateField(
                    "notes",
                    e.target.value
                  )
              }
            />



            <button
              className="wb-button"
              onClick={createMaterial}
            >
              Tallenna
            </button>


          </section>

        )
      }






      {
        error && (

          <div
            className="
              panel
              text-red-400
            "
          >
            {error}
          </div>

        )
      }







      <section>

        <h2
          className="
            mb-4
            text-lg
            font-semibold
          "
        >
          Materiaalivarasto
        </h2>





        {
          loading

          ?

          <div className="panel">
            Ladataan materiaaleja...
          </div>


          :


          materials.length === 0

          ?

          <div className="panel">
            Ei vielä materiaaleja.
          </div>


          :


          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-3
              gap-5
            "
          >

            {
              materials.map(
                material => (

                  <article

                    key={material.id}

                    className="
                      card
                      p-6
                      min-h-[220px]
                    "

                  >


                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-3
                      "
                    >

                      <h3
                        className="
                          text-xl
                          font-semibold
                        "
                      >
                        {material.name}
                      </h3>


                      {
                        editingId !== material.id && (

                          <div
                            className="
                              flex
                              shrink-0
                              gap-3
                            "
                          >

                            <button

                              type="button"

                              onClick={() =>
                                startEdit(material)
                              }

                              className="
                                text-sm
                                text-[var(--wood-accent)]
                                hover:opacity-80
                              "

                            >
                              Muokkaa
                            </button>


                            <button

                              type="button"

                              onClick={() =>
                                deleteMaterial(material.id)
                              }

                              className="
                                text-sm
                                text-red-400
                                hover:text-red-300
                              "

                            >
                              Poista
                            </button>

                          </div>

                        )
                      }

                    </div>



                    {
                      editingId === material.id

                      ?

                      (

                        <div
                          className="
                            mt-5
                            space-y-3
                          "
                        >

                          <input
                            className="wb-input"
                            placeholder="Materiaalin nimi"
                            value={editForm.name}
                            onChange={
                              e =>
                                updateEditField(
                                  "name",
                                  e.target.value
                                )
                            }
                          />


                          <input
                            className="wb-input"
                            placeholder="Kategoria"
                            value={editForm.category}
                            onChange={
                              e =>
                                updateEditField(
                                  "category",
                                  e.target.value
                                )
                            }
                          />


                          <div
                            className="
                              grid
                              grid-cols-2
                              gap-3
                            "
                          >

                            <input
                              className="wb-input"
                              placeholder="Määrä"
                              value={editForm.quantity}
                              onChange={
                                e =>
                                  updateEditField(
                                    "quantity",
                                    e.target.value
                                  )
                              }
                            />


                            <input
                              className="wb-input"
                              placeholder="Yksikkö"
                              value={editForm.unit}
                              onChange={
                                e =>
                                  updateEditField(
                                    "unit",
                                    e.target.value
                                  )
                              }
                            />

                          </div>


                          <div
                            className="
                              grid
                              grid-cols-2
                              gap-3
                            "
                          >

                            <input
                              className="wb-input"
                              placeholder="Hinta (€)"
                              value={editForm.unitPrice}
                              onChange={
                                e =>
                                  updateEditField(
                                    "unitPrice",
                                    e.target.value
                                  )
                              }
                            />


                            <input
                              className="wb-input"
                              placeholder="Toimittaja"
                              value={editForm.supplier}
                              onChange={
                                e =>
                                  updateEditField(
                                    "supplier",
                                    e.target.value
                                  )
                              }
                            />

                          </div>


                          <input
                            className="wb-input"
                            placeholder="Hälytysraja (väh. määrä, valinnainen)"
                            value={editForm.minStock}
                            onChange={
                              e =>
                                updateEditField(
                                  "minStock",
                                  e.target.value
                                )
                            }
                          />


                          <textarea
                            className="wb-input"
                            placeholder="Muistiinpanot"
                            rows="3"
                            value={editForm.notes}
                            onChange={
                              e =>
                                updateEditField(
                                  "notes",
                                  e.target.value
                                )
                            }
                          />


                          <div
                            className="
                              flex
                              gap-3
                            "
                          >

                            <button
                              className="wb-button"
                              onClick={saveEdit}
                            >
                              Tallenna
                            </button>


                            <button

                              type="button"

                              onClick={cancelEdit}

                              className="
                                text-sm
                                text-[var(--wood-muted)]
                                hover:opacity-80
                              "

                            >
                              Peruuta
                            </button>

                          </div>

                        </div>

                      )

                      :

                      (

                        <div
                          className="
                            mt-5
                            space-y-4
                          "
                        >


                          <div>

                            <p className="text-xs text-[var(--wood-muted)]">
                              KATEGORIA
                            </p>

                            <p>
                              {material.category || "-"}
                            </p>

                          </div>




                          <div>

                            <p className="text-xs text-[var(--wood-muted)]">
                              VARASTOSSA
                            </p>

                            <p
                              className="
                                text-lg
                                text-[var(--wood-accent)]
                              "
                            >
                              {material.quantity}
                              {" "}
                              {material.unit}
                            </p>

                          </div>




                          <div>

                            <p className="text-xs text-[var(--wood-muted)]">
                              HINTA
                            </p>

                            <p>
                              {material.unitPrice ?? 0} €
                            </p>

                          </div>




                          <div>

                            <p className="text-xs text-[var(--wood-muted)]">
                              HÄLYTYSRAJA
                            </p>

                            <p>
                              {
                                material.minStock === null ||
                                material.minStock === undefined
                                  ? "Ei asetettu"
                                  : `${material.minStock} ${material.unit}`
                              }
                            </p>

                          </div>




                          <div>

                            <p className="text-xs text-[var(--wood-muted)]">
                              TOIMITTAJA
                            </p>

                            <p>
                              {material.supplier || "-"}
                            </p>

                          </div>





                          {
                            material.notes && (

                              <div>

                                <p className="text-xs text-[var(--wood-muted)]">
                                  MUISTIINPANOT
                                </p>

                                <p
                                  className="
                                    text-sm
                                    mt-1
                                  "
                                >
                                  {material.notes}
                                </p>

                              </div>

                            )
                          }


                        </div>

                      )

                    }


                  </article>

                )
              )
            }


          </div>

        }


      </section>



    </div>

  )

}



export default Inventory
