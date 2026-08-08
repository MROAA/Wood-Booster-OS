import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { apiGet, apiPut } from "../api/client"

function Quotes() {
  const [quotes, setQuotes] = useState([])
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

      const data = await apiGet("/quotes")

      setQuotes(
        Array.isArray(data.quotes)
          ? data.quotes
          : [],
      )
    } catch (loadError) {
      console.error(loadError)
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLowerCase()

    return quotes.filter((quote) => {
      if (!query) {
        return true
      }

      return [
        quote.quoteNumber,
        quote.projectName,
        quote.customerName,
        quote.customerCompany,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      )
    })
  }, [quotes, search])

  const summary = useMemo(() => {
    const now = Date.now()

    const openQuotes = quotes.filter(
      (quote) => quote.status === "Avoin",
    )

    const acceptedCount = quotes.filter(
      (quote) => quote.status === "Hyväksytty",
    ).length

    const rejectedCount = quotes.filter(
      (quote) => quote.status === "Hylätty",
    ).length

    const expiredCount = openQuotes.filter(
      (quote) =>
        new Date(quote.expiresAt).getTime() < now,
    ).length

    return {
      openCount: openQuotes.length,
      acceptedCount,
      rejectedCount,
      expiredCount,
    }
  }, [quotes])

  async function updateStatus(quote, status) {
    try {
      setError("")

      const data = await apiPut(
        `/projects/${quote.projectId}/quote/status`,
        { status },
      )

      setQuotes((current) =>
        current.map((item) =>
          item.id === quote.id
            ? { ...item, status: data.quote.status }
            : item,
        ),
      )
    } catch (updateError) {
      console.error(updateError)
      setError(updateError.message)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="page-title">
          Tarjoukset
        </h1>

        <p className="page-description">
          Kaikki projektien tarjoukset yhdessä paikassa – näe
          heti mitkä ovat vielä auki.
        </p>
      </section>

      {error && (
        <div className="panel text-red-400">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Avoimet tarjoukset"
          value={summary.openCount}
          detail="Odottavat vastausta"
        />

        <SummaryCard
          label="Hyväksytyt"
          value={summary.acceptedCount}
          detail="Hyväksytyksi merkityt"
          highlight
        />

        <SummaryCard
          label="Hylätyt"
          value={summary.rejectedCount}
          detail="Hylätyksi merkityt"
        />

        <SummaryCard
          label="Vanhentuneet"
          value={summary.expiredCount}
          detail="Auki mutta voimassaoloaika päättynyt"
        />
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-semibold">
            Tarjoukset
          </h2>

          <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-sm text-[var(--wood-accent)]">
            {quotes.length} tarjousta
          </span>
        </div>

        <label className="mt-6 block">
          <span className="text-sm text-[var(--wood-muted)]">
            Hae tarjouksista
          </span>

          <input
            className="mt-2 wb-input"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Hae tarjousnumerolla, projektilla tai asiakkaalla..."
          />
        </label>

        {loading ? (
          <p className="mt-6 text-[var(--wood-muted)]">
            Ladataan tarjouksia...
          </p>
        ) : filteredQuotes.length === 0 ? (
          <div className="mt-6 card p-10 text-center">
            <h3 className="text-lg font-semibold">
              Ei tarjouksia
            </h3>

            <p className="mt-2 text-[var(--wood-muted)]">
              Tarjoukset luodaan projektin Tarjous-välilehdellä.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function QuoteCard({ quote, onUpdateStatus }) {
  const expiresAt = new Date(quote.expiresAt)

  const isExpired =
    quote.status === "Avoin" &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt.getTime() < Date.now()

  return (
    <article className="card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold">
              {quote.quoteNumber}
            </h3>

            <StatusBadge status={quote.status} />

            {isExpired && (
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                Vanhentunut
              </span>
            )}
          </div>

          <p className="mt-2">
            <Link
              to={`/projects/${quote.projectId}?tab=quote`}
              className="text-[var(--wood-accent)] hover:opacity-80"
            >
              {quote.projectName}
            </Link>
          </p>

          {(quote.customerName ||
            quote.customerCompany) && (
            <p className="mt-1 text-sm text-[var(--wood-muted)]">
              {quote.customerCompany
                ? `${quote.customerName} – ${quote.customerCompany}`
                : quote.customerName}
            </p>
          )}

          <p className="mt-1 text-sm text-[var(--wood-muted)]">
            Voimassa: {formatDate(quote.expiresAt)} asti
          </p>
        </div>

        <p className="text-2xl font-bold text-[var(--wood-accent)]">
          {formatCurrency(quote.total)}
        </p>
      </div>

      {quote.status === "Avoin" && (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              onUpdateStatus(quote, "Hyväksytty")
            }
            className="wb-button"
          >
            Merkitse hyväksytyksi
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateStatus(quote, "Hylätty")
            }
            className="rounded-xl border border-red-500 px-4 py-2 text-sm text-red-400 transition hover:opacity-90"
          >
            Merkitse hylätyksi
          </button>
        </div>
      )}
    </article>
  )
}

function StatusBadge({ status }) {
  const className =
    status === "Hyväksytty"
      ? "bg-green-500/10 text-green-400"
      : status === "Hylätty"
        ? "bg-red-500/10 text-red-400"
        : "bg-[var(--wood-accent)]/10 text-[var(--wood-accent)]"

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {status}
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

function formatCurrency(value) {
  const number = Number(value)

  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(number) ? number : 0)
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

export default Quotes
