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



function InvoiceTab({
  project,
}) {


  const [
    quoteMeta,
    setQuoteMeta,
  ] = useState(null)



  const [
    invoiceMeta,
    setInvoiceMeta,
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
    creating,
    setCreating,
  ] = useState(false)



  const [
    error,
    setError,
  ] = useState("")



  const [
    form,
    setForm,
  ] = useState({

    dueDays:
      "14",

    paymentTerms:
      "14 pv netto",

    vatPercent:
      "25.5",

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

      apiGet(`/projects/${project.id}/invoice`),

      apiGet(`/projects/${project.id}/quote`),

      apiGet("/business-settings")
        .catch(() => null),

    ])
      .then(([invoiceData, quoteData, settings]) => {

        if(cancelled) {

          return

        }


        const invoice =
          invoiceData.invoice

        const quote =
          quoteData.quote


        setInvoiceMeta(
          invoice
        )


        setQuoteMeta(
          quote
        )


        setBusinessSettings(
          settings
        )


        setLineItems(
          invoice?.lineItems || []
        )


        if(invoice) {

          setForm({

            dueDays:
              String(invoice.dueDays),

            paymentTerms:
              invoice.paymentTerms,

            vatPercent:
              String(invoice.vatPercent),

            laborCost:
              String(invoice.laborCost),

            otherCosts:
              String(invoice.otherCosts),

            customPrice:
              invoice.customPrice === null ||
              invoice.customPrice === undefined
                ?
                ""
                :
                String(invoice.customPrice),

          })

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




  async function createInvoiceFromQuote() {


    try {

      setCreating(true)

      setError("")


      const data =
        await apiPost(
          `/projects/${project.id}/invoice/from-quote`,
          {}
        )


      setInvoiceMeta(
        data.invoice
      )


      setLineItems(
        data.invoice.lineItems || []
      )


      setForm({

        dueDays:
          String(data.invoice.dueDays),

        paymentTerms:
          data.invoice.paymentTerms,

        vatPercent:
          String(data.invoice.vatPercent),

        laborCost:
          String(data.invoice.laborCost),

        otherCosts:
          String(data.invoice.otherCosts),

        customPrice:
          data.invoice.customPrice === null ||
          data.invoice.customPrice === undefined
            ?
            ""
            :
            String(data.invoice.customPrice),

      })

    } catch(createError) {

      console.error(
        "Laskun luominen epäonnistui:",
        createError,
      )


      setError(
        createError.message
      )

    } finally {

      setCreating(false)

    }


  }




  async function saveInvoice() {


    try {

      setSaving(true)

      setError("")


      const data =
        await apiPut(
          `/projects/${project.id}/invoice`,
          {

            dueDays:
              form.dueDays,

            paymentTerms:
              form.paymentTerms,

            vatPercent:
              form.vatPercent,

            laborCost:
              form.laborCost,

            otherCosts:
              form.otherCosts,

            customPrice:
              form.customPrice,

          }
        )


      setInvoiceMeta(
        data.invoice
      )


      window.alert(
        "Lasku tallennettu."
      )

    } catch(saveError) {

      console.error(
        "Laskun tallennus epäonnistui:",
        saveError,
      )


      setError(
        saveError.message
      )

    } finally {

      setSaving(false)

    }


  }




  async function togglePaid() {


    try {

      setError("")


      const data =
        invoiceMeta.isPaid
        ?
        await apiPost(
          `/projects/${project.id}/invoice/mark-unpaid`,
          {}
        )
        :
        await apiPost(
          `/projects/${project.id}/invoice/mark-paid`,
          {}
        )


      setInvoiceMeta(
        data.invoice
      )

    } catch(toggleError) {

      console.error(
        "Maksutilan päivittäminen epäonnistui:",
        toggleError,
      )


      setError(
        toggleError.message
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
          `/projects/${project.id}/invoice/items`,
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
          `/projects/${project.id}/invoice/items/${itemId}`,
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
        `/projects/${project.id}/invoice/items/${itemId}`
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




  function printInvoice() {

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
    toNumber(form.vatPercent)



  const vatAmount =
    effectivePrice *
    (vatPercent / 100)



  const totalWithVat =
    effectivePrice +
    vatAmount



  const invoiceDate =
    invoiceMeta
    ?
    new Date(invoiceMeta.createdAt)
    :
    null



  const dueDate =
    invoiceMeta
    ?
    new Date(
      new Date(invoiceMeta.createdAt).getTime() +
      invoiceMeta.dueDays * 24 * 60 * 60 * 1000
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
          Invoice
        </p>


        <h2
          className="
            mt-2
            text-2xl
            font-semibold
          "
        >

          Lasku {project.name}

        </h2>


        <p
          className="
            mt-2
            text-[var(--wood-muted)]
          "
        >
          Luo lasku hyväksytystä tarjouksesta, muokkaa tietoja ja tulosta.
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




      {
        loading

        ?

        (

          <section
            className="
              panel
              p-6
            "
          >

            <p
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Ladataan...

            </p>

          </section>

        )

        :

        !quoteMeta

        ?

        (

          <section
            className="
              panel
              p-6
            "
          >

            <p
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Luo ensin tarjous tälle projektille Tarjous-välilehdellä.

            </p>

          </section>

        )

        :

        !invoiceMeta

        ?

        (

          <section
            className="
              panel
              p-6
            "
          >

            <p
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Tälle projektille ei ole vielä luotu laskua. Lasku luodaan
              nykyisestä tarjouksesta ja rivit, eräpäivä ja maksuehto
              esitäytetään - voit muokata kaikkea sen jälkeen.

            </p>


            <button

              type="button"

              onClick={
                createInvoiceFromQuote
              }

              disabled={
                creating
              }

              className="
                mt-5
                wb-button
                disabled:cursor-not-allowed
                disabled:opacity-50
              "

            >

              {
                creating
                ?
                "Luodaan..."
                :
                "Luo lasku tarjouksesta"
              }

            </button>


          </section>

        )

        :

        (

          <>


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
                  gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >

                  <span

                    className={
                      invoiceMeta.isPaid
                      ?
                      "card border-emerald-900/60 bg-emerald-950/30 px-3 py-1 text-sm text-emerald-300"
                      :
                      "card border-[var(--wood-accent)]/60 bg-[var(--wood-accent)]/10 px-3 py-1 text-sm text-[var(--wood-accent)]"
                    }

                  >

                    {
                      invoiceMeta.isPaid
                      ?
                      `Maksettu ${formatDate(new Date(invoiceMeta.paidAt))}`
                      :
                      "Avoin"
                    }

                  </span>

                </div>


                <button

                  type="button"

                  onClick={
                    togglePaid
                  }

                  className="
                    wb-button
                  "

                >

                  {
                    invoiceMeta.isPaid
                    ?
                    "Merkitse maksamattomaksi"
                    :
                    "Merkitse maksetuksi"
                  }

                </button>


              </div>

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
                Laskun tiedot
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
                    Eräpäivä (päivää laskun päiväyksestä)
                  </span>


                  <input

                    type="number"

                    name="dueDays"

                    value={
                      form.dueDays
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
                    ALV %
                  </span>


                  <input

                    type="number"

                    step="0.1"

                    name="vatPercent"

                    value={
                      form.vatPercent
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
                  saveInvoice
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
                  "Tallenna lasku"
                }

              </button>


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
                Laskurivit
              </h3>



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
              id="invoice-print-area"

              className="
                panel
                p-8
              "
            >

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
                      Lasku
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

                      Laskunumero:
                      {" "}
                      {invoiceMeta.invoiceNumber}

                    </p>


                    <p>

                      Päivä:
                      {" "}
                      {
                        formatDate(
                          invoiceDate
                        )
                      }

                    </p>


                    <p>

                      Eräpäivä:
                      {" "}
                      {
                        formatDate(
                          dueDate
                        )
                      }

                    </p>


                    <p
                      className={
                        invoiceMeta.isPaid
                        ?
                        "font-medium text-emerald-400"
                        :
                        "font-medium text-[var(--wood-accent)]"
                      }
                    >

                      {
                        invoiceMeta.isPaid
                        ?
                        "MAKSETTU"
                        :
                        "AVOIN"
                      }

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


                </div>


              </div>


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
                  printInvoice
                }

                className="
                  wb-button
                "

              >

                Tulosta

              </button>


            </div>


          </>

        )

      }


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




export default InvoiceTab
