import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client"



const FILE_URL =
  "http://localhost:3001/uploads"



function QuoteTab({
  project,
  onProjectUpdated,
}) {


  const [
    quoteMeta,
    setQuoteMeta,
  ] = useState(null)



  const [
    businessSettings,
    setBusinessSettings,
  ] = useState(null)



  const [
    lineItems,
    setLineItems,
  ] = useState([])



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    saving,
    setSaving,
  ] = useState(false)



  const [
    error,
    setError,
  ] = useState("")



  const [
    form,
    setForm,
  ] = useState({

    validDays:
      "14",

    paymentTerms:
      "14 pv netto",

    deliveryTime:
      "",

    laborCost:
      "0",

    otherCosts:
      "0",

    customPrice:
      "",

  })



  const [
    newItemForm,
    setNewItemForm,
  ] = useState({

    name:
      "",

    unit:
      "kpl",

    quantity:
      "1",

    unitPrice:
      "0",

  })




  useEffect(() => {

    if(!project?.id) {

      return

    }


    let cancelled = false


    setLoading(true)


    Promise.all([

      apiGet(`/projects/${project.id}/quote`),

      apiGet("/business-settings")
        .catch(() => null),

    ])
      .then(([data, settings]) => {

        if(cancelled) {

          return

        }


        const quote =
          data.quote


        setQuoteMeta(
          quote
        )


        setBusinessSettings(
          settings
        )


        setLineItems(
          quote?.lineItems || []
        )


        if(quote) {

          setForm({

            validDays:
              String(quote.validDays),

            paymentTerms:
              quote.paymentTerms,

            deliveryTime:
              quote.deliveryTime || "",

            laborCost:
              String(quote.laborCost),

            otherCosts:
              String(quote.otherCosts),

            customPrice:
              quote.customPrice === null ||
              quote.customPrice === undefined
                ?
                ""
                :
                String(quote.customPrice),

          })

        } else if(settings) {

          setForm(
            current => ({

              ...current,

              validDays:
                String(
                  settings.defaultValidDays ??
                  current.validDays
                ),

              paymentTerms:
                settings.defaultPaymentTerms ||
                current.paymentTerms,

            })
          )

        }

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

  },[
    project?.id,
  ])




  function handleFormChange(
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




  async function saveQuote() {


    try {

      setSaving(true)

      setError("")


      const data =
        await apiPut(
          `/projects/${project.id}/quote`,
          {

            validDays:
              form.validDays,

            paymentTerms:
              form.paymentTerms,

            deliveryTime:
              form.deliveryTime,

            laborCost:
              form.laborCost,

            otherCosts:
              form.otherCosts,

            customPrice:
              form.customPrice,

          }
        )


      setQuoteMeta(
        data.quote
      )


      onProjectUpdated?.(
        data.project
      )


      window.alert(
        "Tarjous tallennettu."
      )

    } catch(saveError) {

      console.error(
        "Tarjouksen tallennus epäonnistui:",
        saveError,
      )


      setError(
        saveError.message
      )

    } finally {

      setSaving(false)

    }


  }




  async function importMaterials() {


    try {

      const data =
        await apiPost(
          `/projects/${project.id}/quote/import-materials`,
          {}
        )


      if(!quoteMeta) {

        setQuoteMeta(
          data.quote
        )

      }


      setLineItems(
        data.lineItems
      )

    } catch(importError) {

      console.error(
        "Materiaalien tuominen epäonnistui:",
        importError,
      )


      setError(
        importError.message
      )

    }


  }




  function handleNewItemChange(
    event
  ) {


    const {
      name,
      value,
    } =
      event.target


    setNewItemForm(
      current => ({

        ...current,

        [name]:
          value,

      })
    )

  }




  async function addLineItem(
    event
  ) {


    event.preventDefault()


    const cleanName =
      newItemForm.name.trim()


    if(!cleanName) {

      return

    }


    try {

      const data =
        await apiPost(
          `/projects/${project.id}/quote/items`,
          {

            name:
              cleanName,

            unit:
              newItemForm.unit,

            quantity:
              newItemForm.quantity,

            unitPrice:
              newItemForm.unitPrice,

          }
        )


      if(!quoteMeta) {

        setQuoteMeta(
          data.quote
        )

      }


      setLineItems(
        current => [
          ...current,
          data.item,
        ]
      )


      setNewItemForm({

        name:
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
        "Rivin lisääminen epäonnistui:",
        addError,
      )


      setError(
        addError.message
      )

    }


  }




  function handleLineItemChange(
    itemId,
    field,
    value
  ) {


    setLineItems(
      current =>
        current.map(
          item =>
            item.id === itemId
            ?
            { ...item, [field]: value }
            :
            item
        )
    )

  }




  async function commitLineItem(
    itemId,
    field,
    value
  ) {


    try {

      const data =
        await apiPut(
          `/projects/${project.id}/quote/items/${itemId}`,
          {

            [field]:
              value,

          }
        )


      setLineItems(
        current =>
          current.map(
            item =>
              item.id === itemId
              ?
              data.item
              :
              item
          )
      )

    } catch(updateError) {

      console.error(
        "Rivin päivittäminen epäonnistui:",
        updateError,
      )


      setError(
        updateError.message
      )

    }


  }




  async function deleteLineItem(
    itemId
  ) {


    const shouldDelete =
      window.confirm(
        "Poistetaanko tämä rivi?"
      )


    if(!shouldDelete) {

      return

    }


    try {

      await apiDelete(
        `/projects/${project.id}/quote/items/${itemId}`
      )


      setLineItems(
        current =>
          current.filter(
            item =>
              item.id !== itemId
          )
      )

    } catch(deleteError) {

      console.error(
        "Rivin poistaminen epäonnistui:",
        deleteError,
      )


      setError(
        deleteError.message
      )

    }


  }




  function printQuote() {

    window.print()

  }




  const materialsSubtotal =
    useMemo(
      () =>

        lineItems.reduce(
          (
            total,
            item
          ) =>

            total +
            (
              toNumber(item.quantity) *
              toNumber(item.unitPrice)
            ),

          0

        ),

      [
        lineItems,
      ]

    )



  const netTotal =
    materialsSubtotal +
    toNumber(form.laborCost) +
    toNumber(form.otherCosts)



  const effectivePrice =
    form.customPrice !== "" &&
    form.customPrice !== null &&
    form.customPrice !== undefined
      ?
      toNumber(form.customPrice)
      :
      netTotal



  const vatPercent =
    businessSettings?.vatPercent ??
    25.5



  const vatAmount =
    effectivePrice *
    (vatPercent / 100)



  const totalWithVat =
    effectivePrice +
    vatAmount



  const quoteDate =
    quoteMeta
    ?
    new Date(quoteMeta.createdAt)
    :
    null



  const validUntil =
    quoteMeta
    ?
    new Date(
      new Date(quoteMeta.createdAt).getTime() +
      quoteMeta.validDays * 24 * 60 * 60 * 1000
    )
    :
    null




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

        <p
          className="
            text-xs
            uppercase
            tracking-wider
            text-[var(--wood-muted)]
          "
        >
          Quote
        </p>


        <h2
          className="
            mt-2
            text-2xl
            font-semibold
          "
        >

          Tarjous {project.name}

        </h2>


        <p
          className="
            mt-2
            text-[var(--wood-muted)]
          "
        >
          Kokoa tarjous, tuo materiaalit ja tulosta asiakkaalle.
        </p>


        {
          error && (

            <div
              className="
                mt-5
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


      </section>





      <section
        className="
          panel
          p-6
        "
      >

        <h3
          className="
            text-lg
            font-semibold
          "
        >
          Tarjouksen tiedot
        </h3>


        <div
          className="
            mt-5
            grid
            gap-4
            md:grid-cols-2
          "
        >

          <label>

            <span
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >
              Voimassaolo (päivää)
            </span>


            <input

              type="number"

              name="validDays"

              value={
                form.validDays
              }

              onChange={
                handleFormChange
              }

              className="
                mt-2
                wb-input
              "

            />

          </label>



          <label>

            <span
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >
              Maksuehto
            </span>


            <input

              type="text"

              name="paymentTerms"

              value={
                form.paymentTerms
              }

              onChange={
                handleFormChange
              }

              className="
                mt-2
                wb-input
              "

            />

          </label>



          <label>

            <span
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >
              Toimitusaika
            </span>


            <input

              type="text"

              name="deliveryTime"

              value={
                form.deliveryTime
              }

              onChange={
                handleFormChange
              }

              placeholder="Esimerkiksi 4-6 viikkoa"

              className="
                mt-2
                wb-input
              "

            />

          </label>



          <label>

            <span
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >
              Mukautettu hinta €
              {" "}
              (jätä tyhjäksi jos lasketaan riveistä)
            </span>


            <input

              type="text"

              name="customPrice"

              value={
                form.customPrice
              }

              onChange={
                handleFormChange
              }

              className="
                mt-2
                wb-input
              "

            />

          </label>



          <label>

            <span
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >
              Työkustannus €
            </span>


            <input

              type="text"

              name="laborCost"

              value={
                form.laborCost
              }

              onChange={
                handleFormChange
              }

              className="
                mt-2
                wb-input
              "

            />

          </label>



          <label>

            <span
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >
              Muut kulut €
            </span>


            <input

              type="text"

              name="otherCosts"

              value={
                form.otherCosts
              }

              onChange={
                handleFormChange
              }

              className="
                mt-2
                wb-input
              "

            />

          </label>


        </div>



        <button

          type="button"

          onClick={
            saveQuote
          }

          disabled={
            saving
          }

          className="
            mt-6
            wb-button
            disabled:cursor-not-allowed
            disabled:opacity-50
          "

        >

          {
            saving
            ?
            "Tallennetaan..."
            :
            "Tallenna tarjous"
          }

        </button>


      </section>





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
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <h3
            className="
              text-lg
              font-semibold
            "
          >
            Tarjousrivit
          </h3>


          <button

            type="button"

            onClick={
              importMaterials
            }

            className="
              wb-button
            "

          >

            Tuo materiaaleista

          </button>


        </div>



        <form

          onSubmit={
            addLineItem
          }

          className="
            mt-5
            grid
            gap-3
            md:grid-cols-5
          "

        >

          <input

            name="name"

            value={
              newItemForm.name
            }

            onChange={
              handleNewItemChange
            }

            placeholder="Rivin nimi"

            className="
              wb-input
              md:col-span-2
            "

          />


          <input

            name="quantity"

            value={
              newItemForm.quantity
            }

            onChange={
              handleNewItemChange
            }

            placeholder="Määrä"

            className="
              wb-input
            "

          />


          <input

            name="unit"

            value={
              newItemForm.unit
            }

            onChange={
              handleNewItemChange
            }

            placeholder="Yksikkö"

            className="
              wb-input
            "

          />


          <input

            name="unitPrice"

            value={
              newItemForm.unitPrice
            }

            onChange={
              handleNewItemChange
            }

            placeholder="Hinta €"

            className="
              wb-input
            "

          />


          <button

            type="submit"

            className="
              wb-button
              md:col-span-5
            "

          >

            + Lisää rivi

          </button>


        </form>



        {
          loading

          ?

          (

            <p
              className="
                mt-5
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Ladataan tarjousta...

            </p>

          )

          :

          lineItems.length === 0

          ?

          (

            <p
              className="
                mt-5
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Ei rivejä vielä.

            </p>

          )

          :

          (

            <div
              className="
                mt-5
                space-y-3
              "
            >

              {
                lineItems.map(
                  item => (

                    <div

                      key={
                        item.id
                      }

                      className="
                        card
                        grid
                        gap-3
                        p-4
                        md:grid-cols-[2fr_1fr_1fr_1fr_auto]
                        md:items-center
                      "

                    >

                      <span>
                        {item.name}
                      </span>


                      <input

                        type="text"

                        value={
                          item.quantity
                        }

                        onChange={
                          event =>
                            handleLineItemChange(
                              item.id,
                              "quantity",
                              event.target.value
                            )
                        }

                        onBlur={
                          event =>
                            commitLineItem(
                              item.id,
                              "quantity",
                              event.target.value
                            )
                        }

                        className="
                          wb-input
                        "

                      />


                      <span
                        className="
                          text-sm
                          text-[var(--wood-muted)]
                        "
                      >
                        {item.unit}
                      </span>


                      <input

                        type="text"

                        value={
                          item.unitPrice
                        }

                        onChange={
                          event =>
                            handleLineItemChange(
                              item.id,
                              "unitPrice",
                              event.target.value
                            )
                        }

                        onBlur={
                          event =>
                            commitLineItem(
                              item.id,
                              "unitPrice",
                              event.target.value
                            )
                        }

                        className="
                          wb-input
                        "

                      />


                      <button

                        type="button"

                        onClick={() =>
                          deleteLineItem(
                            item.id
                          )
                        }

                        className="
                          text-sm
                          text-red-400
                        "

                      >

                        Poista

                      </button>


                    </div>

                  )

                )

              }


            </div>

          )

        }


        <p
          className="
            mt-5
            text-sm
            text-[var(--wood-muted)]
          "
        >

          Rivien summa:
          {" "}
          {
            formatMoney(
              materialsSubtotal
            )
          }

        </p>


      </section>





      <section
        id="quote-print-area"

        className="
          panel
          p-8
        "
      >

        {
          !quoteMeta

          ?

          (

            <p
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Tallenna tarjous ensin nähdäksesi tulostettavan version.

            </p>

          )

          :

          (

            <div>

              {
                businessSettings && (

                  <div
                    className="
                      mb-6
                      flex
                      flex-col
                      gap-4
                      border-b
                      border-[var(--wood-border)]
                      pb-6
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-4
                      "
                    >

                      {
                        businessSettings.logoStoredName && (

                          <img

                            src={
                              `${FILE_URL}/business/${businessSettings.logoStoredName}`
                            }

                            alt="Logo"

                            className="
                              h-14
                              w-14
                              rounded-lg
                              border
                              border-[var(--wood-border)]
                              bg-white
                              object-contain
                              p-1
                            "

                          />

                        )
                      }


                      <div
                        className="
                          text-sm
                          text-[var(--wood-muted)]
                        "
                      >

                        {
                          businessSettings.companyName && (

                            <p
                              className="
                                text-base
                                font-semibold
                                text-[var(--wood-text)]
                              "
                            >
                              {businessSettings.companyName}
                            </p>

                          )
                        }


                        {
                          (
                            businessSettings.streetAddress ||
                            businessSettings.postalCode ||
                            businessSettings.city
                          ) && (

                            <p>
                              {businessSettings.streetAddress}
                              {" "}
                              {businessSettings.postalCode}
                              {" "}
                              {businessSettings.city}
                            </p>

                          )
                        }


                        {
                          businessSettings.businessId && (

                            <p>
                              Y-tunnus:
                              {" "}
                              {businessSettings.businessId}
                            </p>

                          )
                        }

                      </div>

                    </div>



                    <div
                      className="
                        text-sm
                        text-[var(--wood-muted)]
                      "
                    >

                      {
                        businessSettings.phone && (

                          <p>
                            {businessSettings.phone}
                          </p>

                        )
                      }


                      {
                        businessSettings.email && (

                          <p>
                            {businessSettings.email}
                          </p>

                        )
                      }


                      {
                        businessSettings.website && (

                          <p>
                            {businessSettings.website}
                          </p>

                        )
                      }


                      {
                        businessSettings.iban && (

                          <p>
                            {businessSettings.iban}
                          </p>

                        )
                      }

                    </div>


                  </div>

                )
              }



              <div
                className="
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-start
                  sm:justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-xs
                      uppercase
                      tracking-widest
                      text-[var(--wood-muted)]
                    "
                  >
                    Tarjous
                  </p>


                  <h2
                    className="
                      mt-2
                      text-2xl
                      font-semibold
                    "
                  >

                    {project.name}

                  </h2>

                </div>



                <div
                  className="
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >

                  <p>

                    Tarjousnumero:
                    {" "}
                    {quoteMeta.quoteNumber}

                  </p>


                  <p>

                    Päivä:
                    {" "}
                    {
                      formatDate(
                        quoteDate
                      )
                    }

                  </p>


                  <p>

                    Voimassa:
                    {" "}
                    {
                      formatDate(
                        validUntil
                      )
                    }
                    {" "}
                    asti

                  </p>

                </div>


              </div>




              {
                project.customer && (

                  <div
                    className="
                      mt-6
                    "
                  >

                    <p
                      className="
                        text-xs
                        uppercase
                        tracking-wider
                        text-[var(--wood-muted)]
                      "
                    >
                      Asiakas
                    </p>


                    <p
                      className="
                        mt-1
                        font-medium
                      "
                    >

                      {project.customer.name}

                    </p>


                    {
                      project.customer.company && (

                        <p>
                          {project.customer.company}
                        </p>

                      )
                    }


                    {
                      project.customer.email && (

                        <p>
                          {project.customer.email}
                        </p>

                      )
                    }


                    {
                      project.customer.phone && (

                        <p>
                          {project.customer.phone}
                        </p>

                      )
                    }


                  </div>

                )
              }




              <table
                className="
                  mt-8
                  w-full
                  text-sm
                "
              >

                <thead>

                  <tr
                    className="
                      border-b
                      border-[var(--wood-border)]
                      text-left
                      text-xs
                      uppercase
                      tracking-wider
                      text-[var(--wood-muted)]
                    "
                  >

                    <th
                      className="
                        py-2
                      "
                    >
                      Nimike
                    </th>


                    <th
                      className="
                        py-2
                      "
                    >
                      Määrä
                    </th>


                    <th
                      className="
                        py-2
                      "
                    >
                      Yksikkö
                    </th>


                    <th
                      className="
                        py-2
                        text-right
                      "
                    >
                      À-hinta
                    </th>


                    <th
                      className="
                        py-2
                        text-right
                      "
                    >
                      Yhteensä
                    </th>


                  </tr>

                </thead>


                <tbody>

                  {
                    lineItems.map(
                      item => (

                        <tr

                          key={
                            item.id
                          }

                          className="
                            border-b
                            border-[var(--wood-border)]
                          "

                        >

                          <td
                            className="
                              py-2
                            "
                          >
                            {item.name}
                          </td>


                          <td
                            className="
                              py-2
                            "
                          >
                            {item.quantity}
                          </td>


                          <td
                            className="
                              py-2
                            "
                          >
                            {item.unit}
                          </td>


                          <td
                            className="
                              py-2
                              text-right
                            "
                          >

                            {
                              formatMoney(
                                item.unitPrice
                              )
                            }

                          </td>


                          <td
                            className="
                              py-2
                              text-right
                            "
                          >

                            {
                              formatMoney(
                                toNumber(item.quantity) *
                                toNumber(item.unitPrice)
                              )
                            }

                          </td>


                        </tr>

                      )
                    )
                  }

                </tbody>


              </table>




              <div
                className="
                  mt-6
                  flex
                  justify-end
                "
              >

                <div
                  className="
                    w-full
                    max-w-xs
                    space-y-1
                    text-sm
                  "
                >

                  <div
                    className="
                      flex
                      justify-between
                    "
                  >

                    <span>Materiaalit</span>


                    <span>
                      {
                        formatMoney(
                          materialsSubtotal
                        )
                      }
                    </span>

                  </div>


                  <div
                    className="
                      flex
                      justify-between
                    "
                  >

                    <span>Työ</span>


                    <span>
                      {
                        formatMoney(
                          toNumber(form.laborCost)
                        )
                      }
                    </span>

                  </div>


                  <div
                    className="
                      flex
                      justify-between
                    "
                  >

                    <span>Muut kulut</span>


                    <span>
                      {
                        formatMoney(
                          toNumber(form.otherCosts)
                        )
                      }
                    </span>

                  </div>


                  <div
                    className="
                      flex
                      justify-between
                      border-t
                      border-[var(--wood-border)]
                      pt-1
                      font-medium
                    "
                  >

                    <span>Veroton hinta</span>


                    <span>
                      {
                        formatMoney(
                          effectivePrice
                        )
                      }
                    </span>

                  </div>


                  <div
                    className="
                      flex
                      justify-between
                      text-[var(--wood-muted)]
                    "
                  >

                    <span>

                      Alv
                      {" "}
                      {vatPercent}
                      %

                    </span>


                    <span>
                      {
                        formatMoney(
                          vatAmount
                        )
                      }
                    </span>

                  </div>


                  <div
                    className="
                      flex
                      justify-between
                      border-t
                      border-[var(--wood-border)]
                      pt-1
                      text-lg
                      font-semibold
                      text-[var(--wood-accent)]
                    "
                  >

                    <span>Yhteensä</span>


                    <span>
                      {
                        formatMoney(
                          totalWithVat
                        )
                      }
                    </span>

                  </div>


                </div>


              </div>




              <div
                className="
                  mt-6
                  text-sm
                  text-[var(--wood-muted)]
                "
              >

                <p>

                  Maksuehto:
                  {" "}
                  {form.paymentTerms}

                </p>


                {
                  form.deliveryTime && (

                    <p>

                      Toimitusaika:
                      {" "}
                      {form.deliveryTime}

                    </p>

                  )
                }


              </div>


            </div>

          )

        }


      </section>




      <div
        className="
          flex
          gap-3
        "
      >

        <button

          type="button"

          onClick={
            printQuote
          }

          disabled={
            !quoteMeta
          }

          className="
            wb-button
            disabled:cursor-not-allowed
            disabled:opacity-50
          "

        >

          Tulosta

        </button>


      </div>


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




function formatDate(
  date
) {

  if(
    !date ||
    Number.isNaN(date.getTime())
  ) {

    return ""

  }


  return new Intl.DateTimeFormat(
    "fi-FI"
  )
  .format(date)

}



export default QuoteTab
