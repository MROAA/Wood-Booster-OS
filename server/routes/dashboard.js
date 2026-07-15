import express from "express"

export default function createDashboardRouter(prisma) {
  const router = express.Router()

  router.get("/dashboard", async (req, res) => {
    try {
      const [projects, customers] =
        await Promise.all([
          prisma.project.findMany({
            include: {
              customer: true,
              materials: true,
              workflowSteps: true,
              files: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
          }),

          prisma.customer.findMany({
            orderBy: {
              name: "asc",
            },
          }),
        ])

      const activeProjects = projects.filter(
        (project) => project.status !== "Valmis",
      )

      const completedProjects = projects.filter(
        (project) => project.status === "Valmis",
      )

      const totalMaterialCosts = projects.reduce(
        (sum, project) =>
          sum + calculateMaterialTotal(project),
        0,
      )

      const totalLaborHours = projects.reduce(
        (sum, project) =>
          sum + toNumber(project.laborHours),
        0,
      )

      const totalProductionCosts = projects.reduce(
        (sum, project) =>
          sum + calculateProductionCost(project),
        0,
      )

      const estimatedRevenue = projects.reduce(
        (sum, project) =>
          sum + calculateRecommendedPrice(project),
        0,
      )

      const estimatedProfit =
        estimatedRevenue - totalProductionCosts

      const upcomingDeadlines = activeProjects
        .filter((project) => project.deadline)
        .filter(
          (project) =>
            calculateDaysLeft(project.deadline) >= 0,
        )
        .sort(
          (first, second) =>
            new Date(first.deadline) -
            new Date(second.deadline),
        )
        .slice(0, 5)

      const overdueProjects = activeProjects
        .filter((project) => project.deadline)
        .filter(
          (project) =>
            calculateDaysLeft(project.deadline) < 0,
        )
        .sort(
          (first, second) =>
            new Date(first.deadline) -
            new Date(second.deadline),
        )

      const recentProjects = projects.slice(0, 5)

      res.json({
        summary: {
          projectCount: projects.length,
          activeProjectCount: activeProjects.length,
          completedProjectCount:
            completedProjects.length,
          customerCount: customers.length,
          totalMaterialCosts,
          totalLaborHours,
          totalProductionCosts,
          estimatedRevenue,
          estimatedProfit,
        },
        projects,
        customers,
        recentProjects,
        upcomingDeadlines,
        overdueProjects,
      })
    } catch (error) {
      console.error(error)

      res.status(500).json({
        error:
          error.message ||
          "Dashboardin lataaminen epäonnistui",
      })
    }
  })

  return router
}

function calculateMaterialTotal(project) {
  const materials = Array.isArray(project.materials)
    ? project.materials
    : []

  return materials.reduce(
    (sum, material) =>
      sum +
      toNumber(material.quantity) *
        toNumber(material.unitPrice),
    0,
  )
}

function calculateProductionCost(project) {
  const laborTotal =
    toNumber(project.laborHours) *
    toNumber(project.hourlyRate)

  return (
    calculateMaterialTotal(project) +
    laborTotal +
    toNumber(project.otherCosts)
  )
}

function calculateRecommendedPrice(project) {
  const productionCost =
    calculateProductionCost(project)

  return (
    productionCost *
    (1 +
      toNumber(project.markupPercent) / 100)
  )
}

function calculateDaysLeft(value) {
  const deadline = new Date(value)
  const today = new Date()

  deadline.setHours(12, 0, 0, 0)
  today.setHours(12, 0, 0, 0)

  const difference =
    deadline.getTime() - today.getTime()

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24),
  )
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}