const STORAGE_KEY = "woodBoosterInventory"

export function readInventory() {
  try {
    const savedInventory = localStorage.getItem(STORAGE_KEY)
    const inventory = savedInventory
      ? JSON.parse(savedInventory)
      : []

    return Array.isArray(inventory)
      ? inventory
      : []
  } catch {
    return []
  }
}

export function saveInventory(items) {
  const safeItems = Array.isArray(items)
    ? items
    : []

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safeItems),
  )

  return safeItems
}

export function createInventoryItem(itemData) {
  const items = readInventory()
  const now = new Date().toISOString()

  const item = {
    id: createId(),
    name: itemData.name?.trim() || "Nimetön materiaali",
    category: itemData.category?.trim() || "Muu",
    quantity: toNumber(itemData.quantity),
    unit: itemData.unit?.trim() || "kpl",
    minimumQuantity: toNumber(itemData.minimumQuantity),
    unitPrice: toNumber(itemData.unitPrice),
    supplier: itemData.supplier?.trim() || "",
    notes: itemData.notes?.trim() || "",
    createdAt: now,
    updatedAt: now,
  }

  saveInventory([...items, item])

  return item
}

export function updateInventoryItem(itemId, changes) {
  const items = readInventory()
  const updatedAt = new Date().toISOString()

  const updatedItems = items.map((item) => {
    if (String(item.id) !== String(itemId)) {
      return item
    }

    return {
      ...item,
      ...changes,
      updatedAt,
    }
  })

  saveInventory(updatedItems)

  return (
    updatedItems.find(
      (item) => String(item.id) === String(itemId),
    ) || null
  )
}

export function deleteInventoryItem(itemId) {
  const items = readInventory()

  const updatedItems = items.filter(
    (item) => String(item.id) !== String(itemId),
  )

  saveInventory(updatedItems)

  return updatedItems
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}
