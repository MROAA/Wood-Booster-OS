import express from "express"

export default function createPurchasesRouter(prisma) {
  const router = express.Router()

  // Hae kaikki ostotilaukset
  router.get("/purchases", async (req, res) => {
    try {
      const purchases =
        await prisma.purchaseOrder.findMany({
          include: {
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })

      res.json(purchases)
    } catch (error) {
      console.error(error)

      res.status(500).json({
        error:
          error.message ||
          "Ostotilausten lataaminen epäonnistui",
      })
    }
  })

  // Hae yksi ostotilaus
  router.get("/purchases/:id", async (req, res) => {
    try {
      const purchaseId = Number(req.params.id)

      if (!Number.isInteger(purchaseId)) {
        return res.status(400).json({
          error: "Virheellinen ostotilaus",
        })
      }

      const purchase =
        await prisma.purchaseOrder.findUnique({
          where: {
            id: purchaseId,
          },
          include: {
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
        })

      if (!purchase) {
        return res.status(404).json({
          error: "Ostotilausta ei löytynyt",
        })
      }

      res.json(purchase)
    } catch (error) {
      console.error(error)

      res.status(500).json({
        error:
          error.message ||
          "Ostotilauksen lataaminen epäonnistui",
      })
    }
  })

  // Luo uusi ostotilaus
  router.post("/purchases", async (req, res) => {
    try {
      const supplier = String(
        req.body.supplier || "",
      ).trim()

      const requestedItems = Array.isArray(
        req.body.items,
      )
        ? req.body.items
        : []

      if (!supplier) {
        return res.status(400).json({
          error: "Toimittaja puuttuu",
        })
      }

      if (requestedItems.length === 0) {
        return res.status(400).json({
          error:
            "Ostotilauksessa täytyy olla vähintään yksi tuote",
        })
      }

      const cleanItems = requestedItems.map(
        (item) => ({
          inventoryItemId: Number(
            item.inventoryItemId,
          ),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        }),
      )

      const hasInvalidItem = cleanItems.some(
        (item) =>
          !Number.isInteger(
            item.inventoryItemId,
          ) ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.unitPrice) ||
          item.unitPrice < 0,
      )

      if (hasInvalidItem) {
        return res.status(400).json({
          error:
            "Ostotilauksen tuotetiedot ovat virheelliset",
        })
      }

      const inventoryIds = cleanItems.map(
        (item) => item.inventoryItemId,
      )

      const inventoryItems =
        await prisma.inventoryItem.findMany({
          where: {
            id: {
              in: inventoryIds,
            },
          },
        })

      if (
        inventoryItems.length !==
        new Set(inventoryIds).size
      ) {
        return res.status(400).json({
          error:
            "Yhtä tai useampaa varastotuotetta ei löytynyt",
        })
      }

      const totalPrice = cleanItems.reduce(
        (sum, item) =>
          sum +
          item.quantity * item.unitPrice,
        0,
      )

      const purchase =
        await prisma.purchaseOrder.create({
          data: {
            supplier,
            status: "Luonnos",
            totalPrice,
            items: {
              create: cleanItems,
            },
          },
          include: {
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
        })

      res.status(201).json(purchase)
    } catch (error) {
      console.error(error)

      res.status(500).json({
        error:
          error.message ||
          "Ostotilauksen luominen epäonnistui",
      })
    }
  })

  // Päivitä ostotilauksen toimittaja tai tila
  router.put("/purchases/:id", async (req, res) => {
    try {
      const purchaseId = Number(req.params.id)

      if (!Number.isInteger(purchaseId)) {
        return res.status(400).json({
          error: "Virheellinen ostotilaus",
        })
      }

      const currentPurchase =
        await prisma.purchaseOrder.findUnique({
          where: {
            id: purchaseId,
          },
          include: {
            items: true,
          },
        })

      if (!currentPurchase) {
        return res.status(404).json({
          error: "Ostotilausta ei löytynyt",
        })
      }

      const data = {}

      if (req.body.supplier !== undefined) {
        const supplier = String(
          req.body.supplier,
        ).trim()

        if (!supplier) {
          return res.status(400).json({
            error: "Toimittaja puuttuu",
          })
        }

        data.supplier = supplier
      }

      if (req.body.status !== undefined) {
        const status = String(
          req.body.status,
        ).trim()

        const allowedStatuses = [
          "Luonnos",
          "Tilattu",
          "Vastaanotettu",
          "Peruttu",
        ]

        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({
            error: "Virheellinen tilauksen tila",
          })
        }

        if (
          currentPurchase.status ===
            "Vastaanotettu" &&
          status !== "Vastaanotettu"
        ) {
          return res.status(400).json({
            error:
              "Vastaanotettua tilausta ei voi palauttaa aiempaan tilaan",
          })
        }

        data.status = status
      }

      const purchase =
        await prisma.purchaseOrder.update({
          where: {
            id: purchaseId,
          },
          data,
          include: {
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
        })

      res.json(purchase)
    } catch (error) {
      console.error(error)

      res.status(500).json({
        error:
          error.message ||
          "Ostotilauksen päivittäminen epäonnistui",
      })
    }
  })

  // Merkitse tilaus vastaanotetuksi ja lisää määrät varastoon
  router.post(
    "/purchases/:id/receive",
    async (req, res) => {
      try {
        const purchaseId = Number(req.params.id)

        if (!Number.isInteger(purchaseId)) {
          return res.status(400).json({
            error: "Virheellinen ostotilaus",
          })
        }

        const purchase =
          await prisma.purchaseOrder.findUnique({
            where: {
              id: purchaseId,
            },
            include: {
              items: true,
            },
          })

        if (!purchase) {
          return res.status(404).json({
            error: "Ostotilausta ei löytynyt",
          })
        }

        if (
          purchase.status === "Vastaanotettu"
        ) {
          return res.status(400).json({
            error:
              "Ostotilaus on jo vastaanotettu",
          })
        }

        if (purchase.status === "Peruttu") {
          return res.status(400).json({
            error:
              "Peruttua ostotilausta ei voi vastaanottaa",
          })
        }

        await prisma.$transaction(async (tx) => {
          for (const item of purchase.items) {
            await tx.inventoryItem.update({
              where: {
                id: item.inventoryItemId,
              },
              data: {
                quantity: {
                  increment: item.quantity,
                },
              },
            })
          }

          await tx.purchaseOrder.update({
            where: {
              id: purchaseId,
            },
            data: {
              status: "Vastaanotettu",
            },
          })
        })

        const updatedPurchase =
          await prisma.purchaseOrder.findUnique({
            where: {
              id: purchaseId,
            },
            include: {
              items: {
                include: {
                  inventoryItem: true,
                },
              },
            },
          })

        res.json(updatedPurchase)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Tilauksen vastaanottaminen epäonnistui",
        })
      }
    },
  )

  // Poista ostotilaus
  router.delete(
    "/purchases/:id",
    async (req, res) => {
      try {
        const purchaseId = Number(req.params.id)

        if (!Number.isInteger(purchaseId)) {
          return res.status(400).json({
            error: "Virheellinen ostotilaus",
          })
        }

        const purchase =
          await prisma.purchaseOrder.findUnique({
            where: {
              id: purchaseId,
            },
          })

        if (!purchase) {
          return res.status(404).json({
            error: "Ostotilausta ei löytynyt",
          })
        }

        if (
          purchase.status === "Vastaanotettu"
        ) {
          return res.status(400).json({
            error:
              "Vastaanotettua ostotilausta ei voi poistaa",
          })
        }

        await prisma.purchaseOrder.delete({
          where: {
            id: purchaseId,
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
            "Ostotilauksen poistaminen epäonnistui",
        })
      }
    },
  )

  return router
}