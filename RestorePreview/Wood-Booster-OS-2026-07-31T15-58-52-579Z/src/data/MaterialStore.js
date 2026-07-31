const STORAGE_KEY = "woodBoosterMaterials"

export function getMaterials() {
  try {
    const savedMaterials = localStorage.getItem(STORAGE_KEY)

    if (!savedMaterials) {
      return getDefaultMaterials()
    }

    const materials = JSON.parse(savedMaterials)

    return Array.isArray(materials)
      ? materials
      : getDefaultMaterials()
  } catch {
    return getDefaultMaterials()
  }
}

export function saveMaterials(materials) {
  const safeMaterials = Array.isArray(materials)
    ? materials
    : []

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safeMaterials),
  )

  return safeMaterials
}

export function createMaterial(materialData) {
  const materials = getMaterials()

  const newMaterial = {
    id: createId(),
    name: materialData?.name?.trim() || "",
    category: materialData?.category || "Muu",
    unit: materialData?.unit || "kpl",
    unitPrice: Number(materialData?.unitPrice) || 0,
    stock: Number(materialData?.stock) || 0,
    supplier: materialData?.supplier?.trim() || "",
    createdAt: new Date().toISOString(),
  }

  const updatedMaterials = [
    ...materials,
    newMaterial,
  ]

  saveMaterials(updatedMaterials)

  return newMaterial
}

function getDefaultMaterials() {
  return [
    {
      id: createId(),
      name: "Tammi",
      category: "Puu",
      unit: "m",
      unitPrice: 45,
      stock: 0,
      supplier: "",
    },
    {
      id: createId(),
      name: "Epoksi",
      category: "Hartsi",
      unit: "l",
      unitPrice: 42,
      stock: 0,
      supplier: "",
    },
    {
      id: createId(),
      name: "Rubio Monocoat",
      category: "Pintakäsittely",
      unit: "l",
      unitPrice: 68,
      stock: 0,
      supplier: "",
    },
  ]
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