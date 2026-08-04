import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  apiGet,
  apiPost,
  apiDelete,
} from "../api/client"



function MaterialsTab({
  projectId,
}) {


  const [
    inventory,
    setInventory,
  ] = useState([])



  const [
    materials,
    setMaterials,
  ] = useState([])



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState("")



  const [
    form,
    setForm,
  ] = useState({

    inventoryItemId:
      "",

    name:
      "",

    category:
      "",

    unit:
      "kpl",

    quantity:
      "1",

    unitPrice:
      "0",

  })



  useEffect(() => {

    apiGet("/inventory")
      .then(setInventory)
      .catch(loadError => {

        console.error(
          "Varaston haku epäonnistui:",
          loadError,
        )

      })

  }, [])



  useEffect(() => {

    if(!projectId) {

      return

    }


    let cancelled = false


    setLoading(true)


    apiGet(`/projects/${projectId}/materials`)
      .then(data => {

        if(cancelled) {

          return

        }


        setMaterials(
          data.materials || []
        )

      })
      .catch(loadError => {

        if(cancelled) {

          return

        }


        setError(
          loadError.message
        )

      })
      .finally(() => {

        if(!cancelled) {

          setLoading(false)

        }

      })


    return () => {

      cancelled = true

    }

  }, [
    projectId,
  ])



  function handleChange(
    event
  ) {


    const {
      name,
      value,
    } =
      event.target


    setForm(
      current => ({

        ...current,

        [name]:
          value,

      })
    )

  }



  function handleInventoryPick(
    event
  ) {


    const inventoryItemId =
      event.target.value


    const item =
      inventory.find(
        candidate =>
          String(candidate.id) ===
          String(inventoryItemId)
      )


    if(!item) {

      setForm(
        current => ({

          ...current,

          inventoryItemId:
            "",

        })
      )


      return

    }


    setForm(
      current => ({

        ...current,

        inventoryItemId,

        name:
          item.name,

        category:
          item.category || "",

        unit:
          item.unit || "kpl",

        unitPrice:
          String(item.unitPrice ?? current.unitPrice),

      })
    )

  }



  async function addMaterial(
    event
  ) {


    event.preventDefault()


    const cleanName =
      form.name.trim()


    if(!cleanName) {

      return

    }


    try {

      const data =
        await apiPost(
          `/projects/${projectId}/materials`,
          {

            name:
              cleanName,

            category:
              form.category.trim() || null,

            unit:
              form.unit.trim() || "kpl",

            quantity:
              toNumber(form.quantity),

            unitPrice:
              toNumber(form.unitPrice),

          }
        )


      setMaterials(
        current => [
          ...current,
          data.material,
        ]
      )


      setForm({

        inventoryItemId:
          "",

        name:
          "",

        category:
          "",

        unit:
          "kpl",

        quantity:
          "1",

        unitPrice:
          "0",

      })

    } catch(addError) {

      console.error(
        "Materiaalin lisääminen epäonnistui:",
        addError,
      )


      setError(
        addError.message
      )

    }

  }



  async function deleteMaterial(
    materialId
  ) {


    const shouldDelete =
      window.confirm(
        "Poistetaanko materiaali projektilta?"
      )


    if(!shouldDelete) {

      return

    }


    try {

      await apiDelete(
        `/projects/${projectId}/materials/${materialId}`
      )


      setMaterials(
        current =>
          current.filter(
            item =>
              item.id !== materialId
          )
      )

    } catch(deleteError) {

      console.error(
        "Materiaalin poistaminen epäonnistui:",
        deleteError,
      )


      setError(
        deleteError.message
      )

    }

  }



  const totalCost =
    useMemo(
      () =>

        materials.reduce(
          (
            total,
            material
          ) =>

            total +
            (
              toNumber(
                material.quantity
              )
              *
              toNumber(
                material.unitPrice
              )
            ),

          0

        ),

      [
        materials,
      ]

    )



  return (

    <div
      className="
        space-y-6
      "
    >



      <section
        className="
          panel
          p-6
        "
      >

        <div
          className="
            flex
            flex-col
            gap-3
            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          <div>

            <h2
              className="
                text-xl
                font-semibold
              "
            >
              Projektin materiaalit
            </h2>


            <p
              className="
                mt-1
                text-sm
                text-[var(--wood-muted)]
              "
            >
              Projektiin käytettävät materiaalit ja kustannukset.
            </p>

          </div>



          <div
            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-panel)]
              px-4
              py-3
            "
          >

            <p
              className="
                text-xs
                text-[var(--wood-muted)]
              "
            >
              MATERIAALIKUSTANNUS
            </p>


            <p
              className="
                mt-1
                text-lg
                font-semibold
                text-[var(--wood-accent)]
              "
            >
              {formatMoney(totalCost)}
            </p>

          </div>


        </div>



        {
          error && (

            <div
              className="
                mt-4
                card
                border-red-900/60
                bg-red-950/30
                p-3
                text-sm
                text-red-300
              "
            >
              {error}
            </div>

          )
        }



        <form
          onSubmit={
            addMaterial
          }

          className="
            mt-6
            space-y-3
          "
        >

          <select

            name="inventoryItemId"

            value={
              form.inventoryItemId
            }

            onChange={
              handleInventoryPick
            }

            className="
              wb-input
            "

          >

            <option value="">
              Valitse varastosta (esitäyttää tiedot) — valinnainen
            </option>


            {
              inventory.map(
                item => (

                  <option
                    key={
                      item.id
                    }

                    value={
                      item.id
                    }
                  >

                    {item.name}
                    {" "}
                    (varastossa
                    {" "}
                    {item.quantity}
                    {" "}
                    {item.unit}
                    )

                  </option>

                )
              )
            }

          </select>



          <div
            className="
              grid
              gap-3
              md:grid-cols-5
            "
          >

            <input

              name="name"

              value={
                form.name
              }

              onChange={
                handleChange
              }

              className="
                wb-input
                md:col-span-2
              "

              placeholder="Materiaalin nimi"

            />


            <input

              name="quantity"

              value={
                form.quantity
              }

              onChange={
                handleChange
              }

              className="
                wb-input
              "

              placeholder="Määrä"

            />


            <input

              name="unit"

              value={
                form.unit
              }

              onChange={
                handleChange
              }

              className="
                wb-input
              "

              placeholder="Yksikkö"

            />


            <input

              name="unitPrice"

              value={
                form.unitPrice
              }

              onChange={
                handleChange
              }

              className="
                wb-input
              "

              placeholder="Yksikköhinta €"

            />

          </div>



          <button

            type="submit"

            className="
              wb-button
            "

          >

            + Lisää materiaali

          </button>


        </form>


      </section>




      <section
        className="
          space-y-4
        "
      >


        {
          loading

          ?

          (

            <div
              className="
                panel
                p-6
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Ladataan materiaaleja...

            </div>

          )

          :

          materials.length === 0

          ?

          (

            <div
              className="
                panel
                p-6
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Projektille ei ole vielä lisätty materiaaleja.

            </div>

          )


          :

          (

            <div
              className="
                grid
                grid-cols-1
                gap-4
                lg:grid-cols-2
              "
            >

              {
                materials.map(
                  material => (

                    <article

                      key={
                        material.id
                      }

                      className="
                        card
                        p-5
                      "

                    >

                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                        "
                      >

                        <div>

                          <h3
                            className="
                              text-lg
                              font-semibold
                            "
                          >
                            {material.name}
                          </h3>


                          <p
                            className="
                              mt-1
                              text-sm
                              text-[var(--wood-muted)]
                            "
                          >

                            {material.quantity}
                            {" "}
                            {material.unit}

                          </p>

                        </div>



                        <button

                          type="button"

                          onClick={() =>
                            deleteMaterial(
                              material.id
                            )
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





                      <div
                        className="
                          mt-4
                          border-t
                          border-[var(--wood-border)]
                          pt-4
                        "
                      >

                        <p
                          className="
                            text-xs
                            text-[var(--wood-muted)]
                          "
                        >
                          HINTA
                        </p>


                        <p
                          className="
                            mt-1
                          "
                        >

                          {
                            formatMoney(
                              material.quantity *
                              material.unitPrice
                            )
                          }

                        </p>


                      </div>



                    </article>

                  )
                )
              }


            </div>

          )

        }


      </section>


    </div>

  )

}







function toNumber(
  value
) {

  const number =
    Number(value)


  if(
    Number.isFinite(number)
  ) {

    return number

  }


  return 0

}







function formatMoney(
  value
) {

  return new Intl.NumberFormat(
    "fi-FI",
    {
      style:
        "currency",

      currency:
        "EUR",
    }
  ).format(
    toNumber(value)
  )

}



export default MaterialsTab
