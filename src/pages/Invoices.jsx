import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { apiGet, apiPost } from "../api/client"

function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError("")

      const data = await apiGet("/invoices")

      setInvoices(
        Array.isArray(data.invoices)
          ? data.invoices
          : [],
      )
    } catch (loadError) {
      console.error(loadError)
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase()

    return invoices.filter((invoice) => {
      if (!query) {
        return true
      }

      return [
        invoice.invoiceNumber,
        invoice.projectName,
        invoice.customerName,
        invoice.customerCompany,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      )
    })
  }, [invoices, search])

  const summary = useMemo(() => {
    const openInvoices = invoices.filter(
      (invoice) => !invoice.isPaid,
    )

    const paidCount = invoices.filter(
      (invoice) => invoice.isPaid,
    ).length

    const openTotal = openInvoices.reduce(
      (sum, invoice) => sum + toNumber(invoice.total),
      0,
    )

    return {
      openCount: openInvoices.length,
      paidCount,
      openTotal,
    }
  }, [invoices])

  async function togglePaid(invoice) {
    try {
      setError("")

      const data = await apiPost(
        invoice.isPaid
          ? `/projects/${invoice.projectId}/invoice/mark-unpaid`
          : `/projects/${invoice.projectId}/invoice/mark-paid`,
      )

      setInvoices((current) =>
        current.map((item) =>
          item.id === invoice.id
            ? {
                ...item,
                isPaid: data.invoice.isPaid,
                paidAt: data.invoice.paidAt,
              }
            : item,
        ),
      )
    } catch (toggleError) {
      console.error(toggleError)
      setError(toggleError.message)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="page-title">
          Laskut
        </h1>

        <p className="page-description">
          Kaikki projektien laskut yhdessä paikassa – näe
          heti mitkä ovat vielä auki.
        </p>
      </section>

      {error && (
        <div className="panel text-red-400">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Avoimet laskut"
          value={summary.openCount}
          detail="Vielä maksamattomat laskut"
        />

        <SummaryCard
          label="Maksetut laskut"
          value={summary.paidCount}
          detail="Maksetuksi merkityt laskut"
        />

        <SummaryCard
          label="Avoinna yhteensä"
          value={formatCurrency(summary.openTotal)}
          detail="Maksamattomien laskujen summa"
          highlight
        />
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-semibold">
            Laskut
          </h2>

          <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-sm text-[var(--wood-accent)]">
            {invoices.length} laskua
          </span>
        </div>

        <label className="mt-6 block">
          <span className="text-sm text-[var(--wood-muted)]">
            Hae laskuista
          </span>

          <input
            className="mt-2 wb-input"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Hae laskunumerolla, projektilla tai asiakkaalla..."
          />
        </label>

        {loading ? (
          <p className="mt-6 text-[var(--wood-muted)]">
            Ladataan laskuja...
          </p>
        ) : filteredInvoices.length === 0 ? (
          <div className="mt-6 card p-10 text-center">
            <h3 className="text-lg font-semibold">
              Ei laskuja
            </h3>

            <p className="mt-2 text-[var(--wood-muted)]">
              Laskut luodaan projektin tarjouksesta, projektin
              Lasku-välilehdellä.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onTogglePaid={togglePaid}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function InvoiceCard({ invoice, onTogglePaid }) {
  const dueDate = new Date(invoice.dueDate)

  const isOverdue =
    !invoice.isPaid &&
    !Number.isNaN(dueDate.getTime()) &&
    dueDate.getTime() < Date.now()

  return (
    <article className="card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold">
              {invoice.invoiceNumber}
            </h3>

            <PaidBadge isPaid={invoice.isPaid} />

            {isOverdue && (
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                Erääntynyt
              </span>
            )}
          </div>

          <p className="mt-2">
            <Link
              to={`/projects/${invoice.projectId}?tab=invoice`}
              className="text-[var(--wood-accent)] hover:opacity-80"
            >
              {invoice.projectName}
            </Link>
          </p>

          {(invoice.customerName ||
            invoice.customerCompany) && (
            <p className="mt-1 text-sm text-[var(--wood-muted)]">
              {invoice.customerCompany
                ? `${invoice.customerName} – ${invoice.customerCompany}`
                : invoice.customerName}
            </p>
          )}

          <p className="mt-1 text-sm text-[var(--wood-muted)]">
            Eräpäivä: {formatDate(invoice.dueDate)}
          </p>
        </div>

        <p className="text-2xl font-bold text-[var(--wood-accent)]">
          {formatCurrency(invoice.total)}
        </p>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => onTogglePaid(invoice)}
          className="wb-button"
        >
          {invoice.isPaid
            ? "Merkitse maksamattomaksi"
            : "Merkitse maksetuksi"}
        </button>
      </div>
    </article>
  )
}

function PaidBadge({ isPaid }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        isPaid
          ? "bg-green-500/10 text-green-400"
          : "bg-[var(--wood-accent)]/10 text-[var(--wood-accent)]"
      }`}
    >
      {isPaid ? "Maksettu" : "Avoin"}
    </span>
  )
}

function SummaryCard({
  label,
  value,
  detail,
  highlight = false,
}) {
  return (
    <article className="card p-5">
      <p className="text-sm text-[var(--wood-muted)]">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${
          highlight
            ? "text-[var(--wood-accent)]"
            : ""
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-[var(--wood-muted)]">
        {detail}
      </p>
    </article>
  )
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(toNumber(value))
}

function formatDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Ei tiedossa"
  }

  return new Intl.DateTimeFormat("fi-FI", {
    dateStyle: "short",
  }).format(date)
}

export default Invoices
