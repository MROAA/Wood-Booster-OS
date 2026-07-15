import express from "express"

export default function createAIRouter(prisma) {
  const router = express.Router()

  router.post(
    "/ai/generate-project",
    async (req, res) => {
      try {
        const customerName = String(
          req.body.customerName || "",
        ).trim()

        const projectName = String(
          req.body.projectName || "",
        ).trim()

        const description = String(
          req.body.description || "",
        ).trim()

        const woodType = String(
          req.body.woodType || "Tammi",
        ).trim()

        const style = String(
          req.body.style || "Skandinaavinen",
        ).trim()

        const deadline = req.body.deadline
          ? new Date(req.body.deadline)
          : null

        const width = toNumber(req.body.width)
        const depth = toNumber(req.body.depth)
        const height = toNumber(req.body.height)
        const budget = toNumber(req.body.budget)

        if (!projectName) {
          return res.status(400).json({
            error: "Projektin nimi puuttuu",
          })
        }

        if (!description) {
          return res.status(400).json({
            error: "Projektin kuvaus puuttuu",
          })
        }

        const plan = createProjectPlan({
          projectName,
          description,
          woodType,
          style,
          width,
          depth,
          height,
          budget,
        })

        const result = await prisma.$transaction(
          async (tx) => {
            let customer = null

            if (customerName) {
              customer =
                await tx.customer.findFirst({
                  where: {
                    name: customerName,
                  },
                })

              if (!customer) {
                customer =
                  await tx.customer.create({
                    data: {
                      name: customerName,
                    },
                  })
              }
            }

            const project =
              await tx.project.create({
                data: {
                  name: projectName,
                  customerId:
                    customer?.id || null,
                  status: "Suunnittelu",
                  deadline,
                  description,
                  notes: [
                    `AI-luotu suunnitelma`,
                    `Tyyli: ${style}`,
                    `Puulaji: ${woodType}`,
                    width > 0
                      ? `Leveys: ${width} mm`
                      : null,
                    depth > 0
                      ? `Syvyys: ${depth} mm`
                      : null,
                    height > 0
                      ? `Korkeus: ${height} mm`
                      : null,
                    budget > 0
                      ? `Asiakkaan budjetti: ${budget} €`
                      : null,
                  ]
                    .filter(Boolean)
                    .join("\n"),
                  laborHours: plan.laborHours,
                  hourlyRate: plan.hourlyRate,
                  otherCosts: plan.otherCosts,
                  markupPercent:
                    plan.markupPercent,
                },
              })

            await tx.material.createMany({
              data: plan.materials.map(
                (material) => ({
                  name: material.name,
                  quantity: material.quantity,
                  unit: material.unit,
                  unitPrice:
                    material.unitPrice,
                  projectId: project.id,
                }),
              ),
            })

            await tx.workflowStep.createMany({
              data: plan.workflow.map(
                (step, index) => ({
                  title: step.title,
                  columnId: step.columnId,
                  done: false,
                  sortOrder: index,
                  projectId: project.id,
                }),
              ),
            })

            const completeProject =
              await tx.project.findUnique({
                where: {
                  id: project.id,
                },
                include: {
                  customer: true,
                  materials: true,
                  workflowSteps: true,
                  files: true,
                },
              })

            return {
              project: completeProject,
              plan,
            }
          },
        )

        res.status(201).json({
          success: true,
          projectId: result.project.id,
          project: result.project,
          plan: result.plan,
        })
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "AI-projektin luominen epäonnistui",
        })
      }
    },
  )

  return router
}

function createProjectPlan({
  projectName,
  description,
  woodType,
  style,
  width,
  depth,
  height,
  budget,
}) {
  const estimatedWidth =
    width > 0 ? width : 2200

  const estimatedDepth =
    depth > 0 ? depth : 950

  const area =
    (estimatedWidth / 1000) *
    (estimatedDepth / 1000)

  const woodQuantity = Math.max(
    1,
    roundTo(area * 1.2, 2),
  )

  const woodUnitPrice =
    getWoodPrice(woodType)

  const woodCost =
    woodQuantity * woodUnitPrice

  const laborHours = Math.max(
    18,
    Math.round(area * 12),
  )

  const hourlyRate = 55
  const otherCosts = 90
  const markupPercent = 45

  const materials = [
    {
      name: `${woodType} kansimateriaali`,
      quantity: woodQuantity,
      unit: "m²",
      unitPrice: woodUnitPrice,
    },
    {
      name: "Jalkarakenne",
      quantity: 1,
      unit: "sarja",
      unitPrice:
        style === "Industrial"
          ? 240
          : 180,
    },
    {
      name: "Pintakäsittelyaine",
      quantity: Math.max(
        1,
        roundTo(area * 0.7, 2),
      ),
      unit: "l",
      unitPrice: 38,
    },
    {
      name: "Liimat ja kiinnikkeet",
      quantity: 1,
      unit: "erä",
      unitPrice: 45,
    },
  ]

  if (
    description
      .toLowerCase()
      .includes("epoksi") ||
    style === "River table"
  ) {
    materials.push({
      name: "Epoksihartsi",
      quantity: Math.max(
        5,
        roundTo(area * 6, 2),
      ),
      unit: "kg",
      unitPrice: 22,
    })
  }

  const materialCost = materials.reduce(
    (sum, material) =>
      sum +
      material.quantity *
        material.unitPrice,
    0,
  )

  const productionCost =
    materialCost +
    laborHours * hourlyRate +
    otherCosts

  const recommendedPrice =
    productionCost *
    (1 + markupPercent / 100)

  const workflow = [
    {
      title:
        "Suunnittelun ja mittojen vahvistaminen",
      columnId: "planning",
    },
    {
      title:
        "Materiaalien tarkistus ja hankinta",
      columnId: "materials",
    },
    {
      title:
        "Puun oikaisu ja mitallistaminen",
      columnId: "production",
    },
    {
      title: "Rakenteiden valmistus",
      columnId: "production",
    },
    {
      title: "Koekasaus",
      columnId: "production",
    },
    {
      title: "Hionta",
      columnId: "finishing",
    },
    {
      title: "Pintakäsittely",
      columnId: "finishing",
    },
    {
      title: "Lopputarkastus",
      columnId: "finishing",
    },
    {
      title: "Pakkaus ja toimitus",
      columnId: "delivery",
    },
  ]

  return {
    projectName,
    woodType,
    style,
    width: estimatedWidth,
    depth: estimatedDepth,
    height,
    budget,
    materials,
    workflow,
    laborHours,
    hourlyRate,
    otherCosts,
    markupPercent,
    materialCost,
    productionCost,
    recommendedPrice,
  }
}

function getWoodPrice(woodType) {
  const prices = {
    Tammi: 230,
    Saarni: 190,
    Koivu: 145,
    Mänty: 90,
    Pähkinä: 280,
  }

  return prices[woodType] || 160
}

function roundTo(value, decimals) {
  const multiplier = 10 ** decimals

  return (
    Math.round(value * multiplier) /
    multiplier
  )
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}