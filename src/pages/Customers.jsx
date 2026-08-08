import {
  useEffect,
  useState,
} from "react"

import {
  Link,
} from "react-router-dom"

import {
  apiGet,
  apiPost,
  apiDelete,
} from "../api/client"



const emptyCustomer = {

  name: "",
  email: "",
  phone: "",
  company: "",
  notes: ""

}



function Customers() {


  const [
    customers,
    setCustomers,
  ] = useState([])


  const [
    form,
    setForm,
  ] = useState(emptyCustomer)


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





  async function loadCustomers() {

    try {

      setLoading(true)

      const data =
        await apiGet("/customers")


      setCustomers(data)


    } catch (error) {

      setError(
        error.message,
      )

    } finally {

      setLoading(false)

    }

  }





  useEffect(() => {

    loadCustomers()

  }, [])







  async function createCustomer() {


    if (
      !form.name.trim()
    ) {

      return

    }



    try {


      const customer =
        await apiPost(
          "/customers",
          form,
        )



      setCustomers(

        previous => [

          customer,

          ...previous,

        ]

      )



      setForm(
        emptyCustomer,
      )


      setShowForm(false)


    } catch (error) {

      setError(
        error.message,
      )

    }


  }




  async function deleteCustomer(
    event,
    customerId,
  ) {


    event.preventDefault()

    event.stopPropagation()



    const shouldDelete =
      window.confirm(
        "Poistetaanko asiakas?",
      )


    if (!shouldDelete) {

      return

    }



    try {

      await apiDelete(
        `/customers/${customerId}`,
      )


      setCustomers(

        previous =>
          previous.filter(
            customer =>
              customer.id !== customerId,
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

          <h1 className="page-title">
            Asiakkaat
          </h1>


          <p className="page-description">
            Asiakkuuksien hallinta Wood-Booster HQ:ssa.
          </p>


        </div>



        <button

          className="wb-button"

          onClick={() =>
            setShowForm(
              !showForm,
            )
          }

        >

          + Uusi asiakas

        </button>


      </section>







      {
        showForm && (

          <section
            className="
              panel
              max-w-2xl
              space-y-4
            "
          >

            <h2 className="text-lg font-semibold">
              Luo asiakas
            </h2>



            <input
              className="wb-input"
              placeholder="Nimi"
              value={form.name}
              onChange={
                e =>
                  updateField(
                    "name",
                    e.target.value,
                  )
              }
            />



            <input
              className="wb-input"
              placeholder="Yritys"
              value={form.company}
              onChange={
                e =>
                  updateField(
                    "company",
                    e.target.value,
                  )
              }
            />



            <input
              className="wb-input"
              placeholder="Sähköposti"
              value={form.email}
              onChange={
                e =>
                  updateField(
                    "email",
                    e.target.value,
                  )
              }
            />



            <input
              className="wb-input"
              placeholder="Puhelin"
              value={form.phone}
              onChange={
                e =>
                  updateField(
                    "phone",
                    e.target.value,
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
                    e.target.value,
                  )
              }
            />



            <button

              className="wb-button"

              onClick={
                createCustomer
              }

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

          Asiakasrekisteri

        </h2>






        {
          loading

          ?

          (

            <div className="panel">

              Ladataan asiakkaita...

            </div>

          )


          :

          customers.length === 0

          ?

          (

            <div className="panel">

              Ei vielä asiakkaita.

            </div>

          )


          :

          (

            <div
              className="
                grid
                grid-cols-1
                lg:grid-cols-2
                gap-5
              "
            >

              {
                customers.map(

                  customer => (

                    <Link

                      key={
                        customer.id
                      }

                      to={
                        `/customers/${customer.id}`
                      }

                      className="
                        card
                        block
                        transition
                        hover:border-[var(--wood-accent)]
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
                            text-lg
                            font-semibold
                          "
                        >

                          {customer.name}

                        </h3>


                        <button

                          type="button"

                          onClick={
                            event =>
                              deleteCustomer(
                                event,
                                customer.id,
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




                      {
                        customer.company && (

                          <div className="mt-4">

                            <p className="text-xs text-[var(--wood-muted)]">
                              YRITYS
                            </p>

                            <p className="mt-1">
                              {customer.company}
                            </p>

                          </div>

                        )
                      }





                      {
                        customer.email && (

                          <div className="mt-4">

                            <p className="text-xs text-[var(--wood-muted)]">
                              SÄHKÖPOSTI
                            </p>

                            <p className="mt-1">
                              {customer.email}
                            </p>

                          </div>

                        )
                      }





                      {
                        customer.phone && (

                          <div className="mt-4">

                            <p className="text-xs text-[var(--wood-muted)]">
                              PUHELIN
                            </p>

                            <p className="mt-1">
                              {customer.phone}
                            </p>

                          </div>

                        )
                      }





                      {
                        customer.notes && (

                          <div className="mt-4">

                            <p className="text-xs text-[var(--wood-muted)]">
                              MUISTIINPANOT
                            </p>

                            <p className="mt-1 text-sm">
                              {customer.notes}
                            </p>

                          </div>

                        )
                      }



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


export default Customers
