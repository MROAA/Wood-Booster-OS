import { Link } from "react-router"
import { useEffect, useMemo, useState } from "react"

import {
  createCustomer,
  deleteCustomer,
  readCustomers,
} from "../data/customers"


function Customers() {
  const [customers, setCustomers] = useState([])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  })


  useEffect(() => {
    async function loadCustomers() {
      const data = await readCustomers()
      setCustomers(data)
    }

    loadCustomers()
  }, [])


  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) =>
      a.name.localeCompare(b.name, "fi"),
    )
  }, [customers])


  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }


  async function handleSubmit(event) {
    event.preventDefault()

    if (!formData.name.trim()) {
      return
    }

    const customer = await createCustomer(formData)

    setCustomers((current) => [
      ...current,
      customer,
    ])

    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    })
  }


  async function handleDelete(customer) {
    await deleteCustomer(customer.id)

    setCustomers((current) =>
      current.filter(
        (item) => item.id !== customer.id,
      ),
    )
  }


  return (
    <main className="min-h-screen bg-neutral-950 text-white">

      <div className="mx-auto max-w-6xl px-6 py-10">

        <h1 className="text-4xl font-bold">
          Asiakkaat
        </h1>


        <div className="mt-10 grid gap-6 lg:grid-cols-2">


          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">

            <h2 className="text-2xl font-semibold">
              Lisää asiakas
            </h2>


            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >

              {[
                ["name", "Nimi"],
                ["company", "Yritys"],
                ["email", "Sähköposti"],
                ["phone", "Puhelin"],
              ].map(([name, label]) => (

                <input
                  key={name}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={label}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3"
                />

              ))}


              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Muistiinpanot"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3"
              />


              <button
                className="w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black"
              >
                Tallenna asiakas
              </button>

            </form>

          </section>



          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">

            <h2 className="text-2xl font-semibold">
              Asiakasrekisteri
            </h2>


            <div className="mt-6 space-y-4">

              {sortedCustomers.map((customer) => (

                <article
                  key={customer.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 p-5"
                >

                  <h3 className="text-lg font-semibold">
                    {customer.name}
                  </h3>


                  <p className="text-neutral-400">
                    {customer.company}
                  </p>


                  <p>
                    ✉ {customer.email}
                  </p>


                  <div className="mt-4 flex gap-3">

                    <Link
                      to={`/customers/${customer.id}`}
                      className="rounded-lg border border-amber-500 px-3 py-2 text-amber-400"
                    >
                      Avaa asiakas
                    </Link>


                    <button
                      onClick={() => handleDelete(customer)}
                      className="rounded-lg border border-red-800 px-3 py-2 text-red-400"
                    >
                      Poista
                    </button>

                  </div>

                </article>

              ))}

            </div>

          </section>

        </div>

      </div>

    </main>
  )
}


export default Customers