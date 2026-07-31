import { useEffect, useMemo, useState } from "react"

const VAT_PERCENT = 25.5

function QuoteTab({
  project,
  materialTotal,
  laborTotal,
  otherCosts,
  productionCost,
  recommendedPrice,
}) {
  const storageKey = `woodBoosterQuote:${project.id}`

  const [quote, setQuote] = useState(() =>
    readQuote(storageKey),
  )

  useEffect(() => {
    setQuote(readQuote(storageKey))
  }, [storageKey])

  const netPrice = useMemo(() => {
    const customPrice = toNumber(quote.customPrice)

    return customPrice > 0
      ? customPrice
      : toNumber(recommendedPrice)
  }, [quote.customPrice, recommendedPrice])

  const vatAmount = netPrice * (VAT_PERCENT / 100)
  const totalWithVat = netPrice + vatAmount

  const quoteNumber = useMemo(
    () => createQuoteNumber(project),
    [project],
  )

  const quoteDate = useMemo(
    () => new Date(),
    [project.id],
  )

  const validUntil = useMemo(() => {
    const date = new Date(quoteDate)

    date.setDate(
      date.getDate() +
        toNumber(quote.validDays),
    )

    return date
  }, [quoteDate, quote.validDays])

  function handleChange(event) {
    const { name, value } = event.target

    setQuote((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function saveQuote() {
    const savedQuote = {
      ...quote,
      quoteNumber,
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(savedQuote),
    )

    setQuote(savedQuote)
    window.alert("Tarjous tallennettu.")
  }

  function printQuote() {
    window.print()
  }

  return (
    <div>
      <section className="no-print rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Quote editor
            </p>

            <h3 className="mt-2 text-2xl font-semibold">
              Tarjouksen asetukset
            </h3>
          </div>

          <StatusBadge status={quote.status} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormField label="Tarjouksen tila">
            <select
              name="status"
              value={quote.status}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="Luonnos">Luonnos</option>
              <option value="Lähetetty">Lähetetty</option>
              <option value="Hyväksytty">Hyväksytty</option>
              <option value="Hylätty">Hylätty</option>
            </select>
          </FormField>

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

          <FormField label="Mukautettu veroton hinta €">
            <input
              type="number"
              min="0"
              step="0.01"
              name="customPrice"
              value={quote.customPrice}
              onChange={handleChange}
              placeholder={String(
                toNumber(recommendedPrice),
              )}
              className={inputClasses}
            />
          </FormField>

          <FormField label="ALV">
            <input
              type="text"
              value={`${VAT_PERCENT} %`}
              readOnly
              className={`${inputClasses} opacity-70`}
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

          <div className="md:col-span-2">
            <FormField label="Lisäehdot">
              <textarea
                name="terms"
                value={quote.terms}
                onChange={handleChange}
                rows="4"
                className={`${inputClasses} resize-y`}
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveQuote}
            className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            💾 Tallenna tarjous
          </button>

          <button
            type="button"
            onClick={printQuote}
            className="rounded-xl border border-neutral-700 bg-neutral-950 px-5 py-3 font-semibold text-neutral-200 transition hover:bg-neutral-800"
          >
            🖨️ Tulosta tai tallenna PDF
          </button>
        </div>

        {quote.updatedAt && (
          <p className="mt-4 text-sm text-neutral-500">
            Viimeksi tallennettu{" "}
            {formatDateTime(quote.updatedAt)}
          </p>
        )}
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
                <strong>Tarjousnumero:</strong>{" "}
                {quoteNumber}
              </p>

              <p className="mt-2">
                <strong>Päivämäärä:</strong>{" "}
                {formatDateObject(quoteDate)}
              </p>

              <p className="mt-2">
                <strong>Voimassa:</strong>{" "}
                {formatDateObject(validUntil)}
              </p>

              <p className="mt-2">
                <strong>Tila:</strong>{" "}
                {quote.status}
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

              <QuoteRow
                label="Veroton tarjoushinta"
                value={formatCurrency(netPrice)}
                strong
              />

              <QuoteRow
                label={`ALV ${VAT_PERCENT} %`}
                value={formatCurrency(vatAmount)}
              />

              <div className="flex items-center justify-between bg-neutral-950 px-5 py-5 text-white">
                <span className="text-lg font-semibold">
                  Yhteensä sis. ALV
                </span>

                <span className="text-2xl font-bold text-amber-400">
                  {formatCurrency(totalWithVat)}
                </span>
              </div>
            </div>
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

          {quote.terms && (
            <section className="mt-10">
              <h3 className="text-xl font-bold">
                Lisäehdot
              </h3>

              <p className="mt-4 whitespace-pre-wrap leading-7 text-neutral-700">
                {quote.terms}
              </p>
            </section>
          )}

          <section className="mt-12 border-t border-neutral-200 pt-8">
            <p className="font-semibold">
              Wood-Booster
            </p>

            <p className="mt-2 text-sm text-neutral-600">
              Yksilöllisiä massiivipuisia huonekaluja,
              yksi kerrallaan.
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}

function QuoteRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
      <span
        className={
          strong
            ? "font-semibold text-neutral-900"
            : "text-neutral-600"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "font-bold"
            : "font-semibold"
        }
      >
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }) {
  const classes = {
    Luonnos:
      "border-neutral-700 bg-neutral-800 text-neutral-300",
    Lähetetty:
      "border-blue-800 bg-blue-950/50 text-blue-300",
    Hyväksytty:
      "border-green-800 bg-green-950/50 text-green-300",
    Hylätty:
      "border-red-800 bg-red-950/50 text-red-300",
  }

  return (
    <span
      className={`rounded-full border px-3 py-1 text-sm font-medium ${
        classes[status] || classes.Luonnos
      }`}
    >
      {status}
    </span>
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

function readQuote(storageKey) {
  const defaultQuote = {
    status: "Luonnos",
    validDays: "14",
    deliveryTime: "4–6 viikkoa",
    paymentTerms:
      "50 % tilauksesta, 50 % ennen toimitusta",
    description:
      "Yksilöllinen Wood-Booster-huonekalu asiakkaan toiveiden mukaisesti.",
    terms:
      "Tarjous sisältää sovitut materiaalit, valmistuksen ja viimeistelyn. Mahdolliset muutokset sovitaan erikseen.",
    customPrice: "",
    updatedAt: "",
  }

  try {
    const savedQuote =
      localStorage.getItem(storageKey)

    if (!savedQuote) {
      return defaultQuote
    }

    const parsedQuote = JSON.parse(savedQuote)

    return {
      ...defaultQuote,
      ...parsedQuote,
    }
  } catch {
    return defaultQuote
  }
}

function createQuoteNumber(project) {
  const year = new Date().getFullYear()
  const shortId = String(project.id)
    .slice(0, 6)
    .toUpperCase()

  return `WB-${year}-${shortId}`
}

function formatDateObject(date) {
  return new Intl.DateTimeFormat(
    "fi-FI",
  ).format(date)
}

function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("fi-FI", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(toNumber(value))
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-500"

export default QuoteTab