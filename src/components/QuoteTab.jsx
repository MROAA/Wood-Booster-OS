import { useState } from "react"

function QuoteTab({
  project,
  materialTotal,
  laborTotal,
  otherCosts,
  productionCost,
  recommendedPrice,
}) {
  const [quote, setQuote] = useState({
    validDays: "14",
    deliveryTime: "4–6 viikkoa",
    paymentTerms: "50 % tilauksesta, 50 % ennen toimitusta",
    description:
      project.notes ||
      "Yksilöllinen Wood-Booster-huonekalu asiakkaan toiveiden mukaisesti.",
  })

  function handleChange(event) {
    const { name, value } = event.target

    setQuote((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function printQuote() {
    window.print()
  }

  const quoteNumber = createQuoteNumber(project)
  const quoteDate = new Date()
  const validUntil = new Date()

  validUntil.setDate(
    quoteDate.getDate() + Number(quote.validDays || 0),
  )

  return (
    <div>
      <section className="no-print rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Quote settings
        </p>

        <h3 className="mt-2 text-2xl font-semibold">
          Tarjouksen asetukset
        </h3>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormField label="Tarjous voimassa, päivää">
            <input
              type="number"
              min="1"
              name="validDays"
              value={quote.validDays}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <FormField label="Arvioitu toimitusaika">
            <input
              type="text"
              name="deliveryTime"
              value={quote.deliveryTime}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <FormField label="Maksuehto">
            <input
              type="text"
              name="paymentTerms"
              value={quote.paymentTerms}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Tarjouksen kuvaus">
              <textarea
                name="description"
                value={quote.description}
                onChange={handleChange}
                rows="5"
                className={`${inputClasses} resize-y`}
              />
            </FormField>
          </div>
        </div>

        <button
          type="button"
          onClick={printQuote}
          className="mt-6 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 hover:bg-amber-400"
        >
          🖨️ Tulosta tai tallenna PDF
        </button>
      </section>

      <article className="quote-document mt-6 overflow-hidden rounded-2xl border border-neutral-700 bg-white text-neutral-950">
        <header className="border-b border-neutral-200 p-8 sm:p-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">
                Wood-Booster
              </p>

              <h2 className="mt-3 text-4xl font-bold">
                Tarjous
              </h2>

              <p className="mt-3 text-neutral-600">
                Me jatkamme puun tarinaa.
              </p>
            </div>

            <div className="text-sm text-neutral-600 sm:text-right">
              <p>
                <strong>Tarjousnumero:</strong> {quoteNumber}
              </p>

              <p className="mt-2">
                <strong>Päivämäärä:</strong>{" "}
                {formatDateObject(quoteDate)}
              </p>

              <p className="mt-2">
                <strong>Voimassa:</strong>{" "}
                {formatDateObject(validUntil)}
              </p>
            </div>
          </div>
        </header>

        <div className="p-8 sm:p-10">
          <section className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Asiakas
              </p>

              <p className="mt-3 text-lg font-semibold">
                {project.customer || "Asiakas"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Projekti
              </p>

              <p className="mt-3 text-lg font-semibold">
                {project.name}
              </p>
            </div>
          </section>

          <section className="mt-10">
            <h3 className="text-xl font-bold">
              Tarjouksen sisältö
            </h3>

            <p className="mt-4 whitespace-pre-wrap leading-7 text-neutral-700">
              {quote.description}
            </p>
          </section>

          <section className="mt-10">
            <h3 className="text-xl font-bold">
              Hintaerittely
            </h3>

            <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200">
              <QuoteRow
                label="Materiaalit"
                value={formatCurrency(materialTotal)}
              />

              <QuoteRow
                label="Työ"
                value={formatCurrency(laborTotal)}
              />

              <QuoteRow
                label="Muut kulut"
                value={formatCurrency(otherCosts)}
              />

              <QuoteRow
                label="Tuotantokustannus"
                value={formatCurrency(productionCost)}
              />

              <div className="flex items-center justify-between bg-neutral-950 px-5 py-5 text-white">
                <span className="text-lg font-semibold">
                  Tarjouksen kokonaishinta
                </span>

                <span className="text-2xl font-bold text-amber-400">
                  {formatCurrency(recommendedPrice)}
                </span>
              </div>
            </div>

            <p className="mt-3 text-sm text-neutral-500">
              Hinta sisältää projektin suunnittelun, materiaalit,
              valmistuksen ja sovitut muut kustannukset.
            </p>
          </section>

          <section className="mt-10 grid gap-5 sm:grid-cols-2">
            <InfoBox
              label="Arvioitu toimitusaika"
              value={quote.deliveryTime}
            />

            <InfoBox
              label="Maksuehto"
              value={quote.paymentTerms}
            />
          </section>

          <section className="mt-12 border-t border-neutral-200 pt-8">
            <p className="font-semibold">
              Wood-Booster
            </p>

            <p className="mt-2 text-sm text-neutral-600">
              Yksilöllisiä massiivipuisia huonekaluja, yksi kerrallaan.
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}

function QuoteRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
      <span className="text-neutral-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-neutral-100 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
        {label}
      </p>

      <p className="mt-2 font-semibold">
        {value || "Ei määritetty"}
      </p>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label>
      <span className="text-sm text-neutral-300">
        {label}
      </span>

      {children}
    </label>
  )
}

function createQuoteNumber(project) {
  const year = new Date().getFullYear()
  const shortId = String(project.id).slice(0, 6).toUpperCase()

  return `WB-${year}-${shortId}`
}

function formatDateObject(date) {
  return new Intl.DateTimeFormat("fi-FI").format(date)
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0))
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-500"

export default QuoteTab