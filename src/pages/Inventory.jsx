import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
  apiPost,
} from "../api/client"



const emptyMaterial = {

  name: "",
  category: "",
  quantity: "",
  unit: "kpl",
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


                    <h3
                      className="
                        text-xl
                        font-semibold
                      "
                    >
                      {material.name}
                    </h3>



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
