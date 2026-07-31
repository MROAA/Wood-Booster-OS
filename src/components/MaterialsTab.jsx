import {
  useMemo,
  useState,
} from "react"

import {
  readInventory,
  saveInventory,
} from "../data/inventory"



function MaterialsTab({
  project,
  onProjectUpdated,
}) {


  const [
    inventory,
    setInventory,
  ] = useState(
    () =>
      readInventory()
  )



  const [
    projectMaterials,
    setProjectMaterials,
  ] = useState(
    () =>
      Array.isArray(project?.materials)
        ? project.materials
        : []
  )



  const [
    form,
    setForm,
  ] = useState({

    inventoryItemId:
      "",

    quantity:
      "1",

  })







  const selectedInventoryItem =
    useMemo(
      () =>

        inventory.find(
          item =>
            String(item.id) ===
            String(form.inventoryItemId)
        )
        ||
        null,

      [
        inventory,
        form.inventoryItemId,
      ]
    )








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







  function addMaterial(
    event
  ) {


    event.preventDefault()



    const quantity =
      toNumber(
        form.quantity
      )



    if(
      !selectedInventoryItem ||
      quantity <= 0 ||
      quantity >
        toNumber(
          selectedInventoryItem.quantity
        )
    ) {

      return

    }







    const existingMaterial =
      projectMaterials.find(
        material =>
          String(material.inventoryItemId)
          ===
          String(selectedInventoryItem.id)
      )







    let updatedMaterials







    if(existingMaterial) {


      updatedMaterials =
        projectMaterials.map(
          material => {


            if(
              String(material.inventoryItemId)
              !==
              String(selectedInventoryItem.id)
            ) {

              return material

            }



            return {

              ...material,

              quantity:
                toNumber(material.quantity)
                +
                quantity,

            }


          }
        )


    }

    else {


      updatedMaterials = [

        ...projectMaterials,

        {

          id:
            createId(),

          inventoryItemId:
            selectedInventoryItem.id,

          name:
            selectedInventoryItem.name,

          category:
            selectedInventoryItem.category,

          unit:
            selectedInventoryItem.unit,

          unitPrice:
            toNumber(
              selectedInventoryItem.unitPrice
            ),

          quantity,

          createdAt:
            new Date().toISOString(),

        },

      ]

    }








    const updatedInventory =
      inventory.map(
        item => {


          if(
            String(item.id)
            !==
            String(selectedInventoryItem.id)
          ) {

            return item

          }




          return {

            ...item,

            quantity:
              toNumber(item.quantity)
              -
              quantity,

            updatedAt:
              new Date().toISOString(),

          }


        }
      )







    saveInventory(
      updatedInventory
    )


    setInventory(
      updatedInventory
    )



    saveProjectMaterials(
      updatedMaterials
    )



    setForm({

      inventoryItemId:
        "",

      quantity:
        "1",

    })


  }







  function deleteMaterial(
    materialId
  ) {


    const material =
      projectMaterials.find(
        item =>
          String(item.id)
          ===
          String(materialId)
      )



    if(!material) {

      return

    }



    const shouldDelete =
      window.confirm(
        "Poistetaanko materiaali projektilta ja palautetaanko määrä varastoon?"
      )



    if(!shouldDelete) {

      return

    }







    const updatedMaterials =
      projectMaterials.filter(
        item =>
          String(item.id)
          !==
          String(materialId)
      )







    let updatedInventory =
      inventory



    if(material.inventoryItemId) {


      updatedInventory =
        inventory.map(
          item => {


            if(
              String(item.id)
              !==
              String(material.inventoryItemId)
            ) {

              return item

            }



            return {

              ...item,

              quantity:
                toNumber(item.quantity)
                +
                toNumber(material.quantity),

              updatedAt:
                new Date().toISOString(),

            }


          }
        )


      saveInventory(
        updatedInventory
      )


      setInventory(
        updatedInventory
      )


    }



    saveProjectMaterials(
      updatedMaterials
    )


  }
  function saveProjectMaterials(
    materials
  ) {


    const updatedProject = {

      ...project,

      materials,

    }



    setProjectMaterials(
      materials
    )



    if(
      onProjectUpdated
    ) {

      onProjectUpdated(
        updatedProject
      )

    }


  }







  const totalCost =
    useMemo(
      () =>

        projectMaterials.reduce(
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
        projectMaterials,
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





        <form
          onSubmit={
            addMaterial
          }

          className="
            mt-6
            grid
            gap-4
            md:grid-cols-[1fr_180px_auto]
          "
        >



          <select

            name="inventoryItemId"

            value={
              form.inventoryItemId
            }

            onChange={
              handleChange
            }

            className="
              wb-input
            "

          >

            <option value="">
              Valitse materiaali
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
                    (
                    {item.quantity}
                    {" "}
                    {item.unit}
                    )

                  </option>

                )
              )
            }

          </select>




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





          <button

            type="submit"

            className="
              wb-button
            "

          >

            + Lisää

          </button>



        </form>


      </section>







      <section
        className="
          space-y-4
        "
      >


        {
          projectMaterials.length === 0

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
                projectMaterials.map(
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







function createId() {

  return (
    crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString()
  )

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
