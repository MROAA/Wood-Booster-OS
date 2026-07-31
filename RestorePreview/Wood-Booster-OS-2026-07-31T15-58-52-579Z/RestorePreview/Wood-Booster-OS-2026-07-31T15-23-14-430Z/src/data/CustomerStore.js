const STORAGE_KEY = "woodBoosterCustomers"

export function getCustomers() {
  try {
    const savedCustomers = localStorage.getItem(STORAGE_KEY)

    if (!savedCustomers) {
      return []
    }

    const customers = JSON.parse(savedCustomers)

    return Array.isArray(customers)
      ? customers
      : []
  } catch {
    return []
  }
}

export function saveCustomers(customers) {
  const safeCustomers = Array.isArray(customers)
    ? customers
    : []

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safeCustomers),
  )

  return safeCustomers
}

export function createCustomer(customerData) {
  const customers = getCustomers()
  const now = new Date().toISOString()

  const newCustomer = {
    id: createId(),
    name: customerData?.name?.trim() || "",
    company: customerData?.company?.trim() || "",
    email: customerData?.email?.trim() || "",
    phone: customerData?.phone?.trim() || "",
    address: customerData?.address?.trim() || "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  }

  const updatedCustomers = [
    ...customers,
    newCustomer,
  ]

  saveCustomers(updatedCustomers)

  return newCustomer
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