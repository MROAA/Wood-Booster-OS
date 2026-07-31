import { useEffect, useMemo, useState } from "react"

const PURCHASES_API =
  "http://localhost:3001/api/purchases"

const INVENTORY_API =
  "http://localhost:3001/api/inventory"

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

      const [purchasesResponse, inventoryResponse] =
        await Promise.all([
          fetch(PURCHASES_API),
          fetch(INVENTORY_API),
        ])

      const purchasesData =
        await purchasesResponse.json()

      const inventoryData =
        await inventoryResponse.json()

      if (!purchasesResponse.ok) {
        throw new Error(
          purchasesData.error ||
            "Ostotilausten lataaminen epäonnistui",
        )
      }

      if (!inventoryResponse.ok) {
        throw new Error(
          inventoryData.error ||
            "Varaston lataaminen epäonnistui",
        )
      }

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

      const response = await fetch(
        PURCHASES_API,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supplier: cleanSupplier,
            items: cleanItems,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ostotilauksen luominen epäonnistui",
        )
      }

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

      const response = await fetch(
        `${PURCHASES_API}/${purchase.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Tilauksen päivittäminen epäonnistui",
        )
      }

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

      const response = await fetch(
        `${PURCHASES_API}/${purchase.id}/receive`,
        {
          method: "POST",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Tilauksen vastaanottaminen epäonnistui",
        )
      }

      replacePurchase(data)

      const inventoryResponse = await fetch(
        INVENTORY_API,
      )

      const inventoryData =
        await inventoryResponse.json()

      if (inventoryResponse.ok) {
        setInventory(
          Array.isArray(inventoryData)
            ? inventoryData
            : [],
        )
      }
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

      const response = await fetch(
        `${PURCHASES_API}/${purchase.id}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ostotilauksen poistaminen epäonnistui",
        )
      }

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
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
            Wood-Booster Purchasing
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Ostot
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-400">
            Luo ostotilauksia, seuraa niiden
            tilaa ja vastaanota materiaalit suoraan
            varastoon.
          </p>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              New purchase order
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Luo ostotilaus
            </h2>

            <form
              onSubmit={handleCreatePurchase}
              className="mt-6 space-y-5"
            >
              <label className="block">
                <span className="text-sm text-neutral-300">
                  Toimittaja
                </span>

                <input
                  value={supplier}
                  onChange={(event) =>
                    setSupplier(event.target.value)
                  }
                  placeholder="Esimerkiksi Puukeskus"
                  className={inputClasses}
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
                className="w-full rounded-xl border border-neutral-700 px-4 py-3 text-neutral-300 transition hover:border-amber-500 hover:text-amber-400"
              >
                + Lisää tuoterivi
              </button>

              <div className="rounded-xl bg-neutral-950 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-400">
                    Tilauksen yhteensä
                  </span>

                  <span className="text-2xl font-bold text-amber-400">
                    {formatCurrency(orderTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Tallennetaan..."
                  : "Luo ostotilaus"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Purchase orders
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Ostotilaukset
                </h2>
              </div>

              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-400">
                {purchases.length} tilausta
              </span>
            </div>

            <label className="mt-6 block">
              <span className="text-sm text-neutral-300">
                Hae tilauksista
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Hae toimittajalla, tilalla tai tuotteella..."
                className={inputClasses}
              />
            </label>

            {loading ? (
              <p className="mt-6 text-neutral-400">
                Ladataan ostotilauksia...
              </p>
            ) : filteredPurchases.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-10 text-center">
                <p className="text-4xl">🛒</p>

                <h3 className="mt-4 text-lg font-semibold">
                  Ei ostotilauksia
                </h3>

                <p className="mt-2 text-neutral-400">
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
    </main>
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
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm text-neutral-300">
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
            className={inputClasses}
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
          <span className="text-sm text-neutral-300">
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
            className={inputClasses}
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300">
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
            className={inputClasses}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">
            {selectedItem
              ? `Yksikkö: ${selectedItem.unit}`
              : "Valitse tuote"}
          </p>

          <p className="mt-1 font-semibold text-amber-400">
            {formatCurrency(rowTotal)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
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
    <article className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
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

          <p className="mt-2 text-neutral-300">
            {purchase.supplier}
          </p>

          <p className="mt-1 text-sm text-neutral-500">
            {formatDate(purchase.createdAt)}
          </p>
        </div>

        <p className="text-2xl font-bold text-amber-400">
          {formatCurrency(purchase.totalPrice)}
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg bg-neutral-900 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {item.inventoryItem?.name ||
                  "Tuntematon tuote"}
              </p>

              <p className="mt-1 text-sm text-neutral-500">
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

      <div className="mt-5 flex flex-wrap gap-2">
        {purchase.status === "Luonnos" && (
          <button
            type="button"
            onClick={() =>
              onStatusChange(
                purchase,
                "Tilattu",
              )
            }
            className="rounded-lg border border-amber-500 px-3 py-2 text-sm text-amber-400 transition hover:bg-amber-500/10"
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
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
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
            className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-400 transition hover:bg-neutral-800"
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
            className="rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
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
      "bg-neutral-800 text-neutral-300",
    Tilattu:
      "bg-amber-500/10 text-amber-400",
    Vastaanotettu:
      "bg-green-500/10 text-green-400",
    Peruttu:
      "bg-red-500/10 text-red-400",
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        classes[status] ||
        "bg-neutral-800 text-neutral-300"
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
    <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-sm text-neutral-400">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${
          highlight
            ? "text-amber-400"
            : "text-neutral-100"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-neutral-500">
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

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"

export default Purchases
