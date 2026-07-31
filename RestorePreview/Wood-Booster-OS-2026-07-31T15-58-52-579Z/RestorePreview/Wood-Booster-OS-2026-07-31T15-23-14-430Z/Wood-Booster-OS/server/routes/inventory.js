import express from "express"

export default function createInventoryRouter(prisma) {
  const router = express.Router()

  router.get("/inventory", async (req, res) => {
    try {
      const items =
        await prisma.inventoryItem.findMany({
          orderBy: {
            name: "asc",
          },
        })

      res.json(items)
    } catch (error) {
      console.error(error)

      res.status(500).json({
        error:
          error.message ||
          "Varaston lataaminen epäonnistui",
      })
    }
  })

  router.post("/inventory", async (req, res) => {
    try {
      const name = String(
        req.body.name || "",
      ).trim()

      const category = String(
        req.body.category || "Muut",
      ).trim()

      const quantity = Number(
        req.body.quantity || 0,
      )

      const minimumStock = Number(
        req.body.minimumStock || 0,
      )

      const unitPrice = Number(
        req.body.unitPrice || 0,
      )

      const unit = String(
        req.body.unit || "kpl",
      ).trim()

      if (!name) {
        return res.status(400).json({
          error: "Tuotteen nimi puuttuu",
        })
      }

      if (
        !Number.isFinite(quantity) ||
        quantity < 0
      ) {
        return res.status(400).json({
          error: "Virheellinen määrä",
        })
      }

      if (
        !Number.isFinite(minimumStock) ||
        minimumStock < 0
      ) {
        return res.status(400).json({
          error: "Virheellinen minimisaldo",
        })
      }

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        return res.status(400).json({
          error: "Virheellinen yksikköhinta",
        })
      }

      const item =
        await prisma.inventoryItem.create({
          data: {
            name,
            category,
            quantity,
            unit,
            minimumStock,
            unitPrice,
            supplier:
              req.body.supplier?.trim() || null,
            notes:
              req.body.notes?.trim() || null,
          },
        })

      res.status(201).json(item)
    } catch (error) {
      console.error(error)

      res.status(500).json({
        error:
          error.message ||
          "Varastotuotteen lisääminen epäonnistui",
      })
    }
  })

  router.put("/inventory/:id", async (req, res) => {
    try {
      const itemId = Number(req.params.id)

      if (!Number.isInteger(itemId)) {
        return res.status(400).json({
          error: "Virheellinen varastotuote",
        })
      }

      const data = {}

      if (req.body.name !== undefined) {
        const name = String(
          req.body.name,
        ).trim()

        if (!name) {
          return res.status(400).json({
            error: "Tuotteen nimi puuttuu",
          })
        }

        data.name = name
      }

      if (req.body.category !== undefined) {
        data.category = String(
          req.body.category,
        ).trim()
      }

      if (req.body.unit !== undefined) {
        data.unit = String(
          req.body.unit,
        ).trim()
      }

      if (req.body.quantity !== undefined) {
        const quantity = Number(
          req.body.quantity,
        )

        if (
          !Number.isFinite(quantity) ||
          quantity < 0
        ) {
          return res.status(400).json({
            error: "Virheellinen määrä",
          })
        }

        data.quantity = quantity
      }

      if (
        req.body.minimumStock !== undefined
      ) {
        const minimumStock = Number(
          req.body.minimumStock,
        )

        if (
          !Number.isFinite(minimumStock) ||
          minimumStock < 0
        ) {
          return res.status(400).json({
            error: "Virheellinen minimisaldo",
          })
        }

        data.minimumStock = minimumStock
      }

      if (req.body.unitPrice !== undefined) {
        const unitPrice = Number(
          req.body.unitPrice,
        )

        if (
          !Number.isFinite(unitPrice) ||
          unitPrice < 0
        ) {
          return res.status(400).json({
            error: "Virheellinen yksikköhinta",
          })
        }

        data.unitPrice = unitPrice
      }

      if (req.body.supplier !== undefined) {
        data.supplier =
          String(req.body.supplier).trim() ||
          null
      }

      if (req.body.notes !== undefined) {
        data.notes =
          String(req.body.notes).trim() ||
          null
      }

      const item =
        await prisma.inventoryItem.update({
          where: {
            id: itemId,
          },
          data,
        })

      res.json(item)
    } catch (error) {
      console.error(error)

      res.status(500).json({
        error:
          error.message ||
          "Varastotuotteen päivittäminen epäonnistui",
      })
    }
  })

  router.delete(
    "/inventory/:id",
    async (req, res) => {
      try {
        const itemId = Number(req.params.id)

        await prisma.inventoryItem.delete({
          where: {
            id: itemId,
          },
        })

        res.json({
          success: true,
        })
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Varastotuotteen poistaminen epäonnistui",
        })
      }
    },
  )

  return router
}