import {
  Link,
  useParams,
  useNavigate,
} from "react-router-dom"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  apiGet,
  apiPut,
  apiDelete,
} from "../api/client"



function CustomerDetails() {


  const { id } = useParams()

  const navigate = useNavigate()


  const [
    customer,
    setCustomer,
  ] = useState(null)


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    error,
    setError,
  ] = useState("")


  const [
    saving,
    setSaving,
  ] = useState(false)


  const [
    saved,
    setSaved,
  ] = useState(false)


  const [
    form,
    setForm,
  ] = useState({

    name:
      "",

    company:
      "",

    email:
      "",

    phone:
      "",

    notes:
      "",

  })



  const summary =
    useMemo(
      () =>
        summarizeCustomer(
          customer
        ),
      [
        customer,
      ]
    )




  useEffect(() => {

    let cancelled = false


    setLoading(true)

    setError("")


    apiGet(`/customers/${id}`)
      .then(data => {

        if(cancelled) {

          return

        }


        setCustomer(data)

      })
      .catch(loadError => {

        if(cancelled) {

          return

        }


        setError(
          loadError.message ||
          "Asiakkaan lataaminen epäonnistui."
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
    id,
  ])




  useEffect(() => {

    if(!customer) {

      return

    }


    setForm({

      name:
        customer.name || "",

      company:
        customer.company || "",

      email:
        customer.email || "",

      phone:
        customer.phone || "",

      notes:
        customer.notes || "",

    })


    setSaved(false)

  },[
    customer?.id,
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


    setSaved(false)

  }




  async function handleSubmit(
    event
  ) {


    event.preventDefault()


    if(!form.name.trim()) {

      setError(
        "Asiakkaan nimi puuttuu."
      )


      return

    }


    try {

      setSaving(true)

      setError("")


      const updated =
        await apiPut(
          `/customers/${id}`,
          {

            name:
              form.name,

            company:
              form.company,

            email:
              form.email,

            phone:
              form.phone,

            notes:
              form.notes,

          }
        )


      setCustomer(
        current => ({

          ...current,

          ...updated,

        })
      )


      setSaved(true)

    } catch(saveError) {

      setError(
        saveError.message ||
        "Asiakkaan päivittäminen epäonnistui."
      )

    } finally {

      setSaving(false)

    }


  }




  async function handleDelete() {


    const shouldDelete =
      window.confirm(
        "Poistetaanko asiakas?"
      )


    if(!shouldDelete) {

      return

    }


    try {

      await apiDelete(
        `/customers/${id}`
      )


      navigate(
        "/customers"
      )

    } catch(deleteError) {

      setError(
        deleteError.message ||
        "Asiakkaan poistaminen epäonnistui."
      )

    }


  }




  if(loading) {

    return (

      <div className="panel p-6">

        Ladataan asiakasta...

      </div>

    )

  }




  if(error && !customer) {

    return (

      <div className="space-y-5">

        <Link
          to="/customers"
          className="
            text-[var(--wood-accent)]
          "
        >

          ← Asiakkaat

        </Link>


        <div className="panel p-6">

          {error}

        </div>


      </div>

    )

  }




  if(!customer) {

    return (

      <div className="panel p-6">

        Asiakasta ei löytynyt.

      </div>

    )

  }




  return (

    <div
      className="
        space-y-8
      "
    >


      <Link
        to="/customers"
        className="
          text-[var(--wood-accent)]
        "
      >

        ← Asiakkaat

      </Link>




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
              text-sm
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >

            Asiakas

          </p>


          <h1
            className="
              mt-3
              text-4xl
              font-semibold
            "
          >

            {customer.name}

          </h1>


          {
            customer.company && (

              <p
                className="
                  mt-2
                  text-[var(--wood-muted)]
                "
              >

                {customer.company}

              </p>

            )
          }


        </div>



        <button

          type="button"

          onClick={
            handleDelete
          }

          className="
            wb-button
            shrink-0
          "

        >

          Poista asiakas

        </button>


      </div>




      {
        error && (

          <div
            className="
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




      <section
        className="
          panel
          p-6
        "
      >

        <h2
          className="
            text-lg
            font-semibold
          "
        >

          Asiakastiedot

        </h2>



        <form

          onSubmit={
            handleSubmit
          }

          className="
            mt-5
          "

        >

          <div
            className="
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

                Nimi

              </span>


              <input

                type="text"

                name="name"

                value={
                  form.name
                }

                onChange={
                  handleChange
                }

                required

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

                Yritys

              </span>


              <input

                type="text"

                name="company"

                value={
                  form.company
                }

                onChange={
                  handleChange
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

                Sähköposti

              </span>


              <input

                type="email"

                name="email"

                value={
                  form.email
                }

                onChange={
                  handleChange
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

                Puhelin

              </span>


              <input

                type="text"

                name="phone"

                value={
                  form.phone
                }

                onChange={
                  handleChange
                }

                className="
                  mt-2
                  wb-input
                "

              />

            </label>


          </div>



          <label
            className="
              mt-4
              block
            "
          >

            <span
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Muistiinpanot

            </span>


            <textarea

              name="notes"

              rows={4}

              value={
                form.notes
              }

              onChange={
                handleChange
              }

              className="
                mt-2
                wb-input
                resize-y
              "

            />

          </label>



          <div
            className="
              mt-6
              flex
              flex-wrap
              items-center
              gap-4
            "
          >

            <button

              type="submit"

              disabled={
                saving
              }

              className="
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
                "Tallenna muutokset"
              }

            </button>


            {
              saved && (

                <span
                  className="
                    text-sm
                    font-medium
                    text-green-400
                  "
                >

                  ✓ Muutokset tallennettu

                </span>

              )
            }


          </div>


        </form>


      </section>




      <section
        className="
          panel
          p-6
        "
      >

        <h2
          className="
            text-lg
            font-semibold
          "
        >

          Asiakkaan projektit

        </h2>



        {
          (
            summary.quoteCount > 0 ||
            summary.invoiceCount > 0
          ) && (

            <p
              className="
                mt-2
                text-sm
                text-[var(--wood-muted)]
              "
            >

              {summary.quoteCount} tarjousta,
              {" "}
              {summary.invoiceCount} laskua

              {
                summary.openInvoiceCount > 0 && (

                  <>
                    {", "}
                    {summary.openInvoiceCount} auki
                    {" "}
                    ({formatCurrency(summary.openTotal)})
                  </>

                )
              }

            </p>

          )
        }



        {
          !customer.projects ||
          customer.projects.length === 0

          ?

          (

            <p
              className="
                mt-4
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Ei projekteja vielä.

            </p>

          )

          :

          (

            <div
              className="
                mt-4
                grid
                gap-3
                sm:grid-cols-2
              "
            >

              {
                customer.projects.map(
                  project => (

                    <Link

                      key={
                        project.id
                      }

                      to={
                        `/projects/${project.id}`
                      }

                      className="
                        card
                        flex
                        items-center
                        justify-between
                        gap-3
                        p-4
                        transition
                        hover:border-[var(--wood-accent)]
                      "

                    >

                      <span
                        className="
                          font-medium
                        "
                      >

                        {project.name}

                      </span>


                      <span
                        className="
                          text-sm
                          text-[var(--wood-accent)]
                        "
                      >

                        {project.status}

                      </span>


                    </Link>

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




function summarizeCustomer(
  customer
) {

  const projects =
    customer?.projects ||
    []


  const quoteCount =
    projects.filter(
      project => project.quote
    ).length


  const invoices =
    projects
      .map(
        project => project.invoice
      )
      .filter(Boolean)


  const openInvoices =
    invoices.filter(
      invoice => !invoice.isPaid
    )


  const openTotal =
    openInvoices.reduce(
      (sum, invoice) =>
        sum +
        computeInvoiceTotal(invoice),
      0
    )


  return {

    quoteCount,

    invoiceCount:
      invoices.length,

    openInvoiceCount:
      openInvoices.length,

    openTotal,

  }

}




function computeInvoiceTotal(
  invoice
) {

  const materialsSubtotal =
    (invoice.lineItems || []).reduce(

      (total, item) =>
        total +
        (
          toNumber(item.quantity) *
          toNumber(item.unitPrice)
        ),

      0,

    )


  const netTotal =
    materialsSubtotal +
    toNumber(invoice.laborCost) +
    toNumber(invoice.otherCosts)


  const effectivePrice =
    invoice.customPrice !== null &&
    invoice.customPrice !== undefined
      ? toNumber(invoice.customPrice)
      : netTotal


  const vatAmount =
    effectivePrice *
    (toNumber(invoice.vatPercent) / 100)


  return (
    effectivePrice +
    vatAmount
  )

}




function toNumber(
  value
) {

  const number =
    Number(value)


  return Number.isFinite(number)
    ? number
    : 0

}




function formatCurrency(
  value
) {

  return new Intl.NumberFormat(
    "fi-FI",
    {
      style: "currency",
      currency: "EUR",
    }
  ).format(
    toNumber(value)
  )

}



export default CustomerDetails
