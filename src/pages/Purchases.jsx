import { useEffect, useMemo, useState } from "react"

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client"

const emptyLine = {
  inventoryItemId: "",
  quantity: "1",
  unitPrice: "",
}

function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [inventory, setInventory] = useState([])
  const [supplier, setSupplier] = useState("")
  const [lines, setLines] = useState([
    { ...emptyLine },
  ])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError("")

      const [purchasesData, inventoryData] =
        await Promise.all([
          apiGet("/purchases"),
          apiGet("/inventory"),
        ])

      setPurchases(
        Array.isArray(purchasesData)
          ? purchasesData
          : [],
      )

      setInventory(
        Array.isArray(inventoryData)
          ? inventoryData
          : [],
      )
    } catch (loadError) {
      console.error(loadError)
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase()

    return purchases.filter((purchase) => {
      if (!query) {
        return true
      }

      const itemNames = Array.isArray(
        purchase.items,
      )
        ? purchase.items
            .map(
              (item) =>
                item.inventoryItem?.name || "",
            )
            .join(" ")
        : ""

      return [
        purchase.supplier,
        purchase.status,
        itemNames,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      )
    })
  }, [purchases, search])

  const summary = useMemo(() => {
    const totalValue = purchases.reduce(
      (sum, purchase) =>
        sum + toNumber(purchase.totalPrice),
      0,
    )

    const openCount = purchases.filter(
      (purchase) =>
        purchase.status !== "Vastaanotettu" &&
        purchase.status !== "Peruttu",
    ).length

    const receivedCount = purchases.filter(
      (purchase) =>
        purchase.status === "Vastaanotettu",
    ).length

    return {
      totalValue,
      openCount,
      receivedCount,
    }
  }, [purchases])

  const orderTotal = lines.reduce(
    (sum, line) =>
      sum +
      toNumber(line.quantity) *
        toNumber(line.unitPrice),
    0,
  )

  function updateLine(index, field, value) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    )

    setError("")
  }

  function selectInventoryItem(index, itemId) {
    const item = inventory.find(
      (currentItem) =>
        String(currentItem.id) ===
        String(itemId),
    )

    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              inventoryItemId: itemId,
              unitPrice: item
                ? String(item.unitPrice ?? "")
                : "",
            }
          : line,
      ),
    )
  }

  function addLine() {
    setLines((current) => [
      ...current,
      { ...emptyLine },
    ])
  }

  function removeLine(index) {
    setLines((current) => {
      if (current.length === 1) {
        return [{ ...emptyLine }]
      }

      return current.filter(
        (_, lineIndex) => lineIndex !== index,
      )
    })
  }

  async function handleCreatePurchase(event) {
    event.preventDefault()

    const cleanSupplier = supplier.trim()

    const cleanItems = lines
      .map((line) => ({
        inventoryItemId: Number(
          line.inventoryItemId,
        ),
        quantity: toNumber(line.quantity),
        unitPrice: toNumber(line.unitPrice),
      }))
      .filter((line) =>
        Number.isInteger(line.inventoryItemId),
      )

    if (!cleanSupplier) {
      setError("Toimittaja puuttuu.")
      return
    }

    if (cleanItems.length === 0) {
      setError(
        "Lisää vähintään yksi tuote ostotilaukselle.",
      )
      return
    }

    const hasInvalidItem = cleanItems.some(
      (item) =>
        item.quantity <= 0 ||
        item.unitPrice < 0,
    )

    if (hasInvalidItem) {
      setError(
        "Tarkista tuotteiden määrät ja hinnat.",
      )
      return
    }

    try {
      setSaving(true)
      setError("")

      const data = await apiPost("/purchases", {
        supplier: cleanSupplier,
        items: cleanItems,
      })

      setPurchases((current) => [
        data,
        ...current,
      ])

      setSupplier("")
      setLines([{ ...emptyLine }])
    } catch (saveError) {
      console.error(saveError)
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(purchase, status) {
    try {
      setError("")

      const data = await apiPut(
        `/purchases/${purchase.id}`,
        { status },
      )

      replacePurchase(data)
    } catch (updateError) {
      console.error(updateError)
      setError(updateError.message)
    }
  }

  async function receivePurchase(purchase) {
    const shouldReceive = window.confirm(
      `Merkitäänkö tilaus #${purchase.id} vastaanotetuksi ja lisätäänkö tuotteet varastoon?`,
    )

    if (!shouldReceive) {
      return
    }

    try {
      setError("")

      const data = await apiPost(
        `/purchases/${purchase.id}/receive`,
      )

      replacePurchase(data)

      const inventoryData =
        await apiGet("/inventory")

      setInventory(
        Array.isArray(inventoryData)
          ? inventoryData
          : [],
      )
    } catch (receiveError) {
      console.error(receiveError)
      setError(receiveError.message)
    }
  }

  async function deletePurchase(purchase) {
    const shouldDelete = window.confirm(
      `Poistetaanko ostotilaus #${purchase.id}?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      setError("")

      await apiDelete(
        `/purchases/${purchase.id}`,
      )

      setPurchases((current) =>
        current.filter(
          (item) => item.id !== purchase.id,
        ),
      )
    } catch (deleteError) {
      console.error(deleteError)
      setError(deleteError.message)
    }
  }

  function replacePurchase(updatedPurchase) {
    setPurchases((current) =>
      current.map((purchase) =>
        purchase.id === updatedPurchase.id
          ? updatedPurchase
          : purchase,
      ),
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="page-title">
          Ostot
        </h1>

        <p className="page-description">
          Luo ostotilauksia, seuraa niiden tilaa ja
          vastaanota materiaalit suoraan varastoon.
        </p>
      </section>

      {error && (
        <div className="panel text-red-400">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Avoimet tilaukset"
          value={summary.openCount}
          detail="Luonnos- ja tilatut tilaukset"
        />

        <SummaryCard
          label="Vastaanotetut"
          value={summary.receivedCount}
          detail="Varastoon lisätyt tilaukset"
        />

        <SummaryCard
          label="Ostojen arvo"
          value={formatCurrency(
            summary.totalValue,
          )}
          detail="Kaikki ostotilaukset yhteensä"
          highlight
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <section className="panel p-6">
          <h2 className="text-lg font-semibold">
            Luo ostotilaus
          </h2>

          <form
            onSubmit={handleCreatePurchase}
            className="mt-6 space-y-5"
          >
            <label className="block">
              <span className="text-sm text-[var(--wood-muted)]">
                Toimittaja
              </span>

              <input
                className="mt-2 wb-input"
                value={supplier}
                onChange={(event) =>
                  setSupplier(event.target.value)
                }
                placeholder="Esimerkiksi Puukeskus"
              />
            </label>

            <div className="space-y-4">
              {lines.map((line, index) => (
                <OrderLine
                  key={index}
                  line={line}
                  index={index}
                  inventory={inventory}
                  onChange={updateLine}
                  onSelectItem={
                    selectInventoryItem
                  }
                  onRemove={removeLine}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addLine}
              className="w-full rounded-xl border border-[var(--wood-border)] px-4 py-3 text-[var(--wood-muted)] transition hover:border-[var(--wood-accent)] hover:text-[var(--wood-accent)]"
            >
              + Lisää tuoterivi
            </button>

            <div className="card p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--wood-muted)]">
                  Tilauksen yhteensä
                </span>

                <span className="text-2xl font-bold text-[var(--wood-accent)]">
                  {formatCurrency(orderTotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="wb-button w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Tallennetaan..."
                : "Luo ostotilaus"}
            </button>
          </form>
        </section>

        <section className="panel p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-lg font-semibold">
              Ostotilaukset
            </h2>

            <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-sm text-[var(--wood-accent)]">
              {purchases.length} tilausta
            </span>
          </div>

          <label className="mt-6 block">
            <span className="text-sm text-[var(--wood-muted)]">
              Hae tilauksista
            </span>

            <input
              className="mt-2 wb-input"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Hae toimittajalla, tilalla tai tuotteella..."
            />
          </label>

          {loading ? (
            <p className="mt-6 text-[var(--wood-muted)]">
              Ladataan ostotilauksia...
            </p>
          ) : filteredPurchases.length === 0 ? (
            <div className="mt-6 card p-10 text-center">
              <h3 className="text-lg font-semibold">
                Ei ostotilauksia
              </h3>

              <p className="mt-2 text-[var(--wood-muted)]">
                Luo ensimmäinen ostotilaus
                vasemmalla olevalla lomakkeella.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredPurchases.map(
                (purchase) => (
                  <PurchaseCard
                    key={purchase.id}
                    purchase={purchase}
                    onStatusChange={updateStatus}
                    onReceive={receivePurchase}
                    onDelete={deletePurchase}
                  />
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function OrderLine({
  line,
  index,
  inventory,
  onChange,
  onSelectItem,
  onRemove,
}) {
  const selectedItem = inventory.find(
    (item) =>
      String(item.id) ===
      String(line.inventoryItemId),
  )

  const rowTotal =
    toNumber(line.quantity) *
    toNumber(line.unitPrice)

  return (
    <div className="card p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm text-[var(--wood-muted)]">
            Varastotuote
          </span>

          <select
            value={line.inventoryItemId}
            onChange={(event) =>
              onSelectItem(
                index,
                event.target.value,
              )
            }
            className="mt-2 wb-input"
          >
            <option value="">
              Valitse tuote
            </option>

            {inventory.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name} –{" "}
                {formatNumber(item.quantity)}{" "}
                {item.unit} varastossa
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-[var(--wood-muted)]">
            Määrä
          </span>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={line.quantity}
            onChange={(event) =>
              onChange(
                index,
                "quantity",
                event.target.value,
              )
            }
            className="mt-2 wb-input"
          />
        </label>

        <label className="block">
          <span className="text-sm text-[var(--wood-muted)]">
            Yksikköhinta €
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={line.unitPrice}
            onChange={(event) =>
              onChange(
                index,
                "unitPrice",
                event.target.value,
              )
            }
            className="mt-2 wb-input"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--wood-muted)]">
            {selectedItem
              ? `Yksikkö: ${selectedItem.unit}`
              : "Valitse tuote"}
          </p>

          <p className="mt-1 font-semibold text-[var(--wood-accent)]">
            {formatCurrency(rowTotal)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Poista rivi
        </button>
      </div>
    </div>
  )
}

function PurchaseCard({
  purchase,
  onStatusChange,
  onReceive,
  onDelete,
}) {
  const items = Array.isArray(purchase.items)
    ? purchase.items
    : []

  return (
    <article className="card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold">
              Tilaus #{purchase.id}
            </h3>

            <StatusBadge
              status={purchase.status}
            />
          </div>

          <p className="mt-2">
            {purchase.supplier}
          </p>

          <p className="mt-1 text-sm text-[var(--wood-muted)]">
            {formatDate(purchase.createdAt)}
          </p>
        </div>

        <p className="text-2xl font-bold text-[var(--wood-accent)]">
          {formatCurrency(purchase.totalPrice)}
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg bg-[var(--wood-panel)] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {item.inventoryItem?.name ||
                  "Tuntematon tuote"}
              </p>

              <p className="mt-1 text-sm text-[var(--wood-muted)]">
                {formatNumber(item.quantity)}{" "}
                {item.inventoryItem?.unit || ""}
                {" × "}
                {formatCurrency(item.unitPrice)}
              </p>
            </div>

            <span className="shrink-0 font-semibold">
              {formatCurrency(
                toNumber(item.quantity) *
                  toNumber(item.unitPrice),
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {purchase.status === "Luonnos" && (
          <button
            type="button"
            onClick={() =>
              onStatusChange(
                purchase,
                "Tilattu",
              )
            }
            className="text-sm text-[var(--wood-accent)] hover:opacity-80"
          >
            Merkitse tilatuksi
          </button>
        )}

        {purchase.status !== "Vastaanotettu" &&
          purchase.status !== "Peruttu" && (
            <button
              type="button"
              onClick={() =>
                onReceive(purchase)
              }
              className="wb-button"
            >
              Vastaanota varastoon
            </button>
          )}

        {purchase.status === "Luonnos" && (
          <button
            type="button"
            onClick={() =>
              onStatusChange(
                purchase,
                "Peruttu",
              )
            }
            className="text-sm text-[var(--wood-muted)] hover:opacity-80"
          >
            Peru tilaus
          </button>
        )}

        {purchase.status !== "Vastaanotettu" && (
          <button
            type="button"
            onClick={() =>
              onDelete(purchase)
            }
            className="text-sm text-red-400 hover:text-red-300"
          >
            Poista
          </button>
        )}
      </div>
    </article>
  )
}

function StatusBadge({ status }) {
  const classes = {
    Luonnos:
      "bg-[var(--wood-card)] text-[var(--wood-muted)]",
    Tilattu:
      "bg-[var(--wood-accent)]/10 text-[var(--wood-accent)]",
    Vastaanotettu:
      "bg-green-500/10 text-green-400",
    Peruttu:
      "bg-red-500/10 text-red-400",
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        classes[status] ||
        "bg-[var(--wood-card)] text-[var(--wood-muted)]"
      }`}
    >
      {status || "Tuntematon"}
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

function formatNumber(value) {
  return new Intl.NumberFormat("fi-FI", {
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

function formatDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Ei tiedossa"
  }

  return new Intl.DateTimeFormat("fi-FI", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export default Purchases
