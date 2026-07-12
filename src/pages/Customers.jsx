import { useState } from "react"
import {
  createCustomer,
  getCustomers,
} from "../data/CustomerStore"

function Customers() {
  const [customers, setCustomers] = useState(() =>
    getCustomers(),
  )

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
  })

  const [saved, setSaved] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))

    setSaved(false)
  }

  function handleSubmit(event) {
    event.preventDefault()

    const customerName = form.name.trim()

    if (!customerName) {
      return
    }

    const newCustomer = createCustomer({
      ...form,
      name: customerName,
    })

    setCustomers((currentCustomers) => [
      ...currentCustomers,
      newCustomer,
    ])

    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
    })

    setSaved(true)
  }

  return (
    <div>
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
          Wood-Booster CRM
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Asiakkaat
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-400">
          Tallenna asiakkaiden yhteystiedot ja pidä
          asiakasprojektit järjestyksessä.
        </p>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            New customer
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Lisää asiakas
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <FormField label="Nimi">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Esimerkiksi Matti Virtanen"
                required
                className={inputClasses}
              />
            </FormField>

            <FormField label="Yritys">
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Yrityksen nimi"
                className={inputClasses}
              />
            </FormField>

            <FormField label="Sähköposti">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="asiakas@example.com"
                className={inputClasses}
              />
            </FormField>

            <FormField label="Puhelin">
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="040 123 4567"
                className={inputClasses}
              />
            </FormField>

            <FormField label="Osoite">
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                placeholder="Katuosoite, postinumero ja kaupunki"
                className={`${inputClasses} resize-y`}
              />
            </FormField>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
            >
              + Lisää asiakas
            </button>

            {saved && (
              <p className="text-center text-sm text-green-400">
                ✓ Asiakas tallennettu
              </p>
            )}
          </form>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Customer register
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Asiakasrekisteri
              </h2>
            </div>

            <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
              {customers.length} asiakasta
            </span>
          </div>

          {customers.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-10 text-center">
              <p className="text-5xl">👥</p>

              <h3 className="mt-5 text-xl font-semibold">
                Ei asiakkaita vielä
              </h3>

              <p className="mt-2 text-neutral-400">
                Lisää ensimmäinen asiakas vasemmalla
                olevalla lomakkeella.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {customers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function CustomerCard({ customer }) {
  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-neutral-100">
            {customer.name}
          </h3>

          <p className="mt-1 text-sm text-amber-400">
            {customer.company || "Yksityisasiakas"}
          </p>
        </div>

        <span className="text-2xl">
          👤
        </span>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <CustomerInfo
          label="Sähköposti"
          value={customer.email}
        />

        <CustomerInfo
          label="Puhelin"
          value={customer.phone}
        />

        <CustomerInfo
          label="Osoite"
          value={customer.address}
        />
      </div>
    </article>
  )
}

function CustomerInfo({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-neutral-600">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-neutral-300">
        {value || "Ei määritetty"}
      </p>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-300">
        {label}
      </span>

      {children}
    </label>
  )
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"

export default Customers