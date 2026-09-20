import express from "express"

/*
 * Heartwood Project Assistant - roadmap/task/decision CRUD.
 * Knowledge base reuses the existing generic KnowledgeDocument model
 * (topic="heartwood") via /api/knowledge, so it isn't duplicated here.
 */
export default function createHeartwoodAssistantRouter(prisma) {
  const router = express.Router()

  const STATUSES = [
    "backlog",
    "ready",
    "in_progress",
    "blocked",
    "review",
    "testing",
    "done",
  ]

  router.get("/heartwood/tasks", async (req, res) => {
    try {
      const { status, phase } = req.query

      const tasks = await prisma.heartwoodTask.findMany({
        where: {
          ...(status ? { status: String(status) } : {}),
          ...(phase ? { phase: String(phase) } : {}),
        },
        orderBy: [{ phase: "asc" }, { createdAt: "asc" }],
      })

      res.json(tasks)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })

  router.post("/heartwood/tasks", async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        phase,
        status,
        priority,
        complexity,
        dependencies,
        acceptanceCriteria,
      } = req.body || {}

      if (!title?.trim()) {
        return res.status(400).json({ error: "Otsikko (title) vaaditaan" })
      }

      if (status && !STATUSES.includes(status)) {
        return res.status(400).json({ error: "Tuntematon status" })
      }

      const task = await prisma.heartwoodTask.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          category: category?.trim() || "mechanic",
          phase: phase?.trim() || "Phase 0 - Concept",
          status: status || "backlog",
          priority: priority || "medium",
          complexity: complexity || "M",
          dependencies: dependencies?.trim() || null,
          acceptanceCriteria: acceptanceCriteria?.trim() || null,
        },
      })

      res.status(201).json(task)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })

  router.patch("/heartwood/tasks/:id", async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        phase,
        status,
        priority,
        complexity,
        dependencies,
        acceptanceCriteria,
      } = req.body || {}

      if (status && !STATUSES.includes(status)) {
        return res.status(400).json({ error: "Tuntematon status" })
      }

      const data = {}
      if (title !== undefined) data.title = title.trim()
      if (description !== undefined) data.description = description?.trim() || null
      if (category !== undefined) data.category = category
      if (phase !== undefined) data.phase = phase
      if (status !== undefined) data.status = status
      if (priority !== undefined) data.priority = priority
      if (complexity !== undefined) data.complexity = complexity
      if (dependencies !== undefined) data.dependencies = dependencies?.trim() || null
      if (acceptanceCriteria !== undefined) {
        data.acceptanceCriteria = acceptanceCriteria?.trim() || null
      }

      const task = await prisma.heartwoodTask.update({
        where: { id: Number(req.params.id) },
        data,
      })

      res.json(task)
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Tehtävää ei löytynyt" })
      }
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })

  router.delete("/heartwood/tasks/:id", async (req, res) => {
    try {
      await prisma.heartwoodTask.delete({
        where: { id: Number(req.params.id) },
      })
      res.status(204).end()
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Tehtävää ei löytynyt" })
      }
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })

  router.get("/heartwood/decisions", async (req, res) => {
    try {
      const decisions = await prisma.heartwoodDecision.findMany({
        orderBy: { createdAt: "desc" },
      })
      res.json(decisions)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })

  router.post("/heartwood/decisions", async (req, res) => {
    try {
      const { title, decision, reason, status, affectedAreas } = req.body || {}

      if (!title?.trim() || !decision?.trim()) {
        return res.status(400).json({
          error: "Otsikko (title) ja päätös (decision) vaaditaan",
        })
      }

      const created = await prisma.heartwoodDecision.create({
        data: {
          title: title.trim(),
          decision: decision.trim(),
          reason: reason?.trim() || null,
          status: status || "accepted",
          affectedAreas: affectedAreas?.trim() || null,
        },
      })

      res.status(201).json(created)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })

  router.delete("/heartwood/decisions/:id", async (req, res) => {
    try {
      await prisma.heartwoodDecision.delete({
        where: { id: Number(req.params.id) },
      })
      res.status(204).end()
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Päätöstä ei löytynyt" })
      }
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })

  /*
   * PRD kohta 26/27 - "Mitä teen seuraavaksi?" ja Daily Brief.
   * Yksinkertainen sääntö MVP:lle: ensin in_progress-tehtävät (jatka
   * kesken olevaa), sitten ready (valmiina aloitettavaksi), muuten
   * vanhin backlog-tehtävä. blocked-tehtävät ohitetaan aina, koska ne
   * eivät ole tehtävissä juuri nyt.
   */
  router.get("/heartwood/next-action", async (req, res) => {
    try {
      const priorityOrder = { high: 0, medium: 1, low: 2 }

      const candidates = await prisma.heartwoodTask.findMany({
        where: { status: { in: ["in_progress", "ready", "backlog"] } },
        orderBy: [{ phase: "asc" }, { createdAt: "asc" }],
      })

      const byStatus = (targetStatus) =>
        candidates
          .filter((task) => task.status === targetStatus)
          .sort(
            (a, b) =>
              (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1),
          )[0]

      const next =
        byStatus("in_progress") || byStatus("ready") || byStatus("backlog") || null

      res.json({ next })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })

  router.get("/heartwood/brief", async (req, res) => {
    try {
      const [tasks, latestDecision] = await Promise.all([
        prisma.heartwoodTask.findMany(),
        prisma.heartwoodDecision.findFirst({ orderBy: { createdAt: "desc" } }),
      ])

      const counts = STATUSES.reduce((acc, status) => {
        acc[status] = tasks.filter((task) => task.status === status).length
        return acc
      }, {})

      const activePhase =
        tasks.find((task) => task.status === "in_progress")?.phase ||
        tasks.find((task) => task.status === "ready")?.phase ||
        tasks[0]?.phase ||
        null

      const blocked = tasks.filter((task) => task.status === "blocked")

      res.json({
        counts,
        totalTasks: tasks.length,
        activePhase,
        blocked,
        latestDecision,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })

  return router
}
