import express from "express"
import cors from "cors"
import { PrismaClient } from "./generated/prisma/client.js"
import path from "node:path"
import { fileURLToPath } from "node:url"
import createDashboardRouter from "./routes/dashboard.js"
import createInventoryRouter from "./routes/inventory.js"
import createPurchasesRouter from "./routes/purchases.js"
import createAIRouter from "./routes/ai.js"
import createKnowledgeRouter from "./routes/knowledge.js"
import createKnowledgeUploadRouter from "./routes/knowledge-upload.js"
import createAIBrainChatRouter from "./routes/ai-brain-chat.js"

import createFilesRouter from "./routes/files.js"


const prisma = new PrismaClient()
const app = express()
const PORT = 3001
const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

const uploadsDirectory = path.join(
  currentDirectory,
  "uploads",
)

app.use(cors())
app.use(express.json())
app.use(
  "/uploads",
  express.static(uploadsDirectory),
)

app.use(
  "/api",
  createFilesRouter(prisma),
)
app.use(
  "/api",
  createDashboardRouter(prisma),
)
app.use(
  "/api",
  createInventoryRouter(prisma),
)
app.use(
  "/api",
  createPurchasesRouter(prisma),
)
app.use(
  "/api",
  createAIRouter(prisma),
)
app.use(
  "/api",
  createKnowledgeRouter(prisma),
)
app.use(
  "/api",
  createKnowledgeUploadRouter(prisma),
)
app.use(
  "/api",
  createAIBrainChatRouter(prisma),
)

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Wood-Booster Server",
  })
})

app.get("/api/customers", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: "asc",
      },
    })

    res.json(customers)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.get("/api/customers/:id/projects", async (req, res) => {
  try {
    const customerId = Number(req.params.id)

    const projects = await prisma.project.findMany({
      where: {
        customerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json(projects)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.get("/api/customers/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id)

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    })

    if (!customer) {
      return res.status(404).json({
        error: "Asiakasta ei löytynyt",
      })
    }

    res.json(customer)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.post("/api/customers", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim()

    if (!name) {
      return res.status(400).json({
        error: "Asiakkaan nimi puuttuu",
      })
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        company: req.body.company?.trim() || null,
        email: req.body.email?.trim() || null,
        phone: req.body.phone?.trim() || null,
        notes: req.body.notes?.trim() || null,
      },
    })

    res.status(201).json(customer)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.post("/api/projects", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim()
    const customerId = Number(req.body.customerId)

    if (!name) {
      return res.status(400).json({
        error: "Projektin nimi puuttuu",
      })
    }

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({
        error: "Virheellinen asiakas",
      })
    }

    const project = await prisma.project.create({
      data: {
        name,
        customerId,
      },
    })

    res.status(201).json(project)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.get("/api/projects/:id/materials", async (req, res) => {
  try {
    const projectId = Number(req.params.id)

    const materials = await prisma.material.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json(materials)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.post("/api/materials", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim()
    const projectId = Number(req.body.projectId)
    const quantity = Number(req.body.quantity || 1)
    const unitPrice = Number(req.body.unitPrice || 0)
    const unit = String(req.body.unit || "kpl").trim()

    if (!name) {
      return res.status(400).json({
        error: "Materiaalin nimi puuttuu",
      })
    }

    if (!Number.isInteger(projectId)) {
      return res.status(400).json({
        error: "Virheellinen projekti",
      })
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({
        error: "Virheellinen määrä",
      })
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return res.status(400).json({
        error: "Virheellinen yksikköhinta",
      })
    }

    const material = await prisma.material.create({
      data: {
        name,
        quantity,
        unit,
        unitPrice,
        projectId,
      },
    })

    res.status(201).json(material)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.delete("/api/materials/:id", async (req, res) => {
  try {
    const materialId = Number(req.params.id)

    await prisma.material.delete({
      where: {
        id: materialId,
      },
    })

    res.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.put("/api/projects/:id/costing", async (req, res) => {
  try {
    const projectId = Number(req.params.id)

    const laborHours = Number(req.body.laborHours || 0)
    const hourlyRate = Number(req.body.hourlyRate || 0)
    const otherCosts = Number(req.body.otherCosts || 0)
    const markupPercent = Number(
      req.body.markupPercent || 0,
    )

    if (!Number.isInteger(projectId)) {
      return res.status(400).json({
        error: "Virheellinen projekti",
      })
    }

    if (
      !Number.isFinite(laborHours) ||
      laborHours < 0 ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate < 0 ||
      !Number.isFinite(otherCosts) ||
      otherCosts < 0 ||
      !Number.isFinite(markupPercent) ||
      markupPercent < 0
    ) {
      return res.status(400).json({
        error: "Virheelliset kustannustiedot",
      })
    }

    const project = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        laborHours,
        hourlyRate,
        otherCosts,
        markupPercent,
      },
      include: {
        customer: true,
        materials: true,
        workflowSteps: true,
      },
    })

    res.json(project)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.get("/api/projects/:id/workflow", async (req, res) => {
  try {
    const projectId = Number(req.params.id)

    const workflowSteps =
      await prisma.workflowStep.findMany({
        where: {
          projectId,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      })

    res.json(workflowSteps)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.post("/api/workflow", async (req, res) => {
  try {
    const title = String(req.body.title || "").trim()
    const columnId = String(
      req.body.columnId || "planning",
    ).trim()
    const projectId = Number(req.body.projectId)

    if (!title) {
      return res.status(400).json({
        error: "Työvaiheen nimi puuttuu",
      })
    }

    if (!Number.isInteger(projectId)) {
      return res.status(400).json({
        error: "Virheellinen projekti",
      })
    }

    const stepCount =
      await prisma.workflowStep.count({
        where: {
          projectId,
        },
      })

    const workflowStep =
      await prisma.workflowStep.create({
        data: {
          title,
          columnId,
          projectId,
          sortOrder: stepCount,
        },
      })

    res.status(201).json(workflowStep)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.put("/api/workflow/:id", async (req, res) => {
  try {
    const workflowId = Number(req.params.id)

    if (!Number.isInteger(workflowId)) {
      return res.status(400).json({
        error: "Virheellinen työvaihe",
      })
    }

    const data = {}

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim()

      if (!title) {
        return res.status(400).json({
          error: "Työvaiheen nimi puuttuu",
        })
      }

      data.title = title
    }

    if (req.body.columnId !== undefined) {
      data.columnId = String(
        req.body.columnId,
      ).trim()
    }

    if (req.body.done !== undefined) {
      data.done = Boolean(req.body.done)
    }

    if (req.body.sortOrder !== undefined) {
      data.sortOrder = Number(req.body.sortOrder)
    }

    const workflowStep =
      await prisma.workflowStep.update({
        where: {
          id: workflowId,
        },
        data,
      })

    res.json(workflowStep)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.delete("/api/workflow/:id", async (req, res) => {
  try {
    const workflowId = Number(req.params.id)

    await prisma.workflowStep.delete({
      where: {
        id: workflowId,
      },
    })

    res.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.get("/api/projects", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        customer: true,
        materials: true,
        workflowSteps: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json(projects)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.id)

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    })

    res.json({ success: true })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})
app.put("/api/projects/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.id)

    const project = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: req.body.name,
        status: req.body.status,
        description: req.body.description,
        notes: req.body.notes,
        deadline: req.body.deadline
          ? new Date(req.body.deadline)
          : null,
      },
      include: {
        customer: true,
        materials: true,
        workflowSteps: true,
      },
    })

    res.json(project)

  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})
app.get("/api/projects/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.id)

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        customer: true,
        materials: true,
        workflowSteps: true,
      },
    })

    if (!project) {
      return res.status(404).json({
        error: "Projektia ei löytynyt",
      })
    }

    res.json(project)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: error.message,
    })
  }
})

app.listen(PORT, () => {
  console.log(
    `Wood-Booster Server toimii portissa ${PORT}`,
  )
})