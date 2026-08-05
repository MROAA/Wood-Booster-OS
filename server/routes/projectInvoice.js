import express from "express"


async function getBusinessSettings(
  prisma
) {

  return await prisma.businessSettings.findUnique({

    where: {
      id: 1,
    },

  })

}


function generateInvoiceNumber(
  invoiceId,
  prefix
) {

  return (
    (prefix || "WB-L") +
    String(invoiceId).padStart(5, "0")
  )

}


function toNumber(
  value
) {

  const number =
    Number(value)


  if (Number.isFinite(number)) {

    return number

  }


  return 0

}


function computeInvoiceTotal(
  invoice
) {

  const materialsSubtotal =
    (invoice.lineItems || []).reduce(

      (total, item) =>
        total +
        (
          toNumber(item.quantity) *
          toNumber(item.unitPrice)
        ),

      0,

    )


  const netTotal =
    materialsSubtotal +
    toNumber(invoice.laborCost) +
    toNumber(invoice.otherCosts)


  const effectivePrice =
    invoice.customPrice !== null &&
    invoice.customPrice !== undefined
      ? toNumber(invoice.customPrice)
      : netTotal


  const vatAmount =
    effectivePrice *
    (toNumber(invoice.vatPercent) / 100)


  return (
    effectivePrice +
    vatAmount
  )

}


function parseInvoiceScalars(
  body,
  businessSettings
) {

  const {
    dueDays,
    paymentTerms,
    vatPercent,
    laborCost,
    otherCosts,
    customPrice,
  } =
    body || {}


  const defaultDueDays =
    businessSettings?.defaultInvoiceDueDays ??
    14

  const defaultPaymentTerms =
    businessSettings?.defaultPaymentTerms ||
    "14 pv netto"

  const defaultVatPercent =
    businessSettings?.vatPercent ??
    25.5


  const scalars = {}


  if (dueDays !== undefined) {

    const parsedDueDays =
      Number(dueDays)


    scalars.dueDays =
      Number.isFinite(parsedDueDays) &&
      parsedDueDays >= 0
        ? Math.round(parsedDueDays)
        : defaultDueDays

  }


  if (paymentTerms !== undefined) {

    scalars.paymentTerms =
      String(paymentTerms || "").trim() ||
      defaultPaymentTerms

  }


  if (vatPercent !== undefined) {

    const parsedVatPercent =
      Number(vatPercent)


    scalars.vatPercent =
      Number.isFinite(parsedVatPercent) &&
      parsedVatPercent >= 0 &&
      parsedVatPercent <= 100
        ? parsedVatPercent
        : defaultVatPercent

  }


  if (laborCost !== undefined) {

    const parsedLaborCost =
      Number(laborCost)


    scalars.laborCost =
      Number.isFinite(parsedLaborCost)
        ? parsedLaborCost
        : 0

  }


  if (otherCosts !== undefined) {

    const parsedOtherCosts =
      Number(otherCosts)


    scalars.otherCosts =
      Number.isFinite(parsedOtherCosts)
        ? parsedOtherCosts
        : 0

  }


  if (customPrice !== undefined) {

    scalars.customPrice =
      customPrice === null ||
      customPrice === ""
        ? null
        : Number(customPrice)

  }


  return scalars

}


export default function createProjectInvoiceRouter(
  prisma,
) {
  const router = express.Router()



  /*
   * GET /api/projects/:id/invoice
   *
   * Palauttaa projektin laskun riveineen, tai
   * {success:true, invoice:null} jos laskua ei ole vielä.
   */
  router.get(
    "/projects/:id/invoice",
    async (request, response) => {

      const projectId =
        Number(request.params.id)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Virheellinen projektin ID.",

          })

      }


      try {

        const project =
          await prisma.project.findUnique({

            where: {
              id:
                projectId,
            },

            select: {
              id: true,
            },

          })


        if (!project) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Projektia ei löytynyt.",

            })

        }


        const invoice =
          await prisma.invoice.findUnique({

            where: {
              projectId,
            },

            include: {

              lineItems: {

                orderBy: {
                  createdAt: "asc",
                },

              },

            },

          })


        response.json({

          success: true,

          invoice:
            invoice || null,

        })

      } catch (error) {

        console.error(
          "Project invoice GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Laskun haku epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects/:id/invoice/from-quote
   *
   * Luo laskun projektin tarjouksesta: kopioi rivit ja
   * esitäyttää arvot tarjouksesta/asetuksista. Ei koskaan
   * muuta projektin status-kenttää.
   */
  router.post(
    "/projects/:id/invoice/from-quote",
    async (request, response) => {

      const projectId =
        Number(request.params.id)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Virheellinen projektin ID.",

          })

      }


      try {

        const project =
          await prisma.project.findUnique({

            where: {
              id:
                projectId,
            },

            select: {
              id: true,
            },

          })


        if (!project) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Projektia ei löytynyt.",

            })

        }


        const existingInvoice =
          await prisma.invoice.findUnique({

            where: {
              projectId,
            },

          })


        if (existingInvoice) {

          return response
            .status(409)
            .json({

              success: false,

              error:
                "Tälle projektille on jo luotu lasku.",

            })

        }


        const quote =
          await prisma.quote.findUnique({

            where: {
              projectId,
            },

            include: {

              lineItems: {

                orderBy: {
                  createdAt: "asc",
                },

              },

            },

          })


        if (!quote) {

          return response
            .status(400)
            .json({

              success: false,

              error:
                "Luo ensin tarjous tälle projektille ennen laskun luomista.",

            })

        }


        const businessSettings =
          await getBusinessSettings(
            prisma
          )


        const created =
          await prisma.invoice.create({

            data: {

              projectId,

              invoiceNumber:
                "",

              dueDays:
                businessSettings?.defaultInvoiceDueDays ??
                14,

              paymentTerms:
                quote.paymentTerms ||
                businessSettings?.defaultPaymentTerms ||
                "14 pv netto",

              vatPercent:
                businessSettings?.vatPercent ??
                25.5,

              laborCost:
                quote.laborCost,

              otherCosts:
                quote.otherCosts,

              customPrice:
                quote.customPrice,

            },

          })


        if (quote.lineItems.length > 0) {

          await prisma.invoiceLineItem.createMany({

            data:
              quote.lineItems.map(
                item => ({

                  invoiceId:
                    created.id,

                  name:
                    item.name,

                  unit:
                    item.unit,

                  quantity:
                    item.quantity,

                  unitPrice:
                    item.unitPrice,

                })
              ),

          })

        }


        const invoice =
          await prisma.invoice.update({

            where: {
              id:
                created.id,
            },

            data: {

              invoiceNumber:
                generateInvoiceNumber(
                  created.id,
                  businessSettings?.invoiceNumberPrefix,
                ),

            },

            include: {

              lineItems: {

                orderBy: {
                  createdAt: "asc",
                },

              },

            },

          })


        response.status(201).json({

          success: true,

          invoice,

        })

      } catch (error) {

        console.error(
          "Project invoice from-quote error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Laskun luominen epäonnistui.",

        })

      }

    },
  )



  /*
   * PUT /api/projects/:id/invoice
   *
   * Päivittää laskun perustiedot. Ei luo laskua jos sitä ei
   * ole - lasku syntyy vain from-quote-reitin kautta. Ei
   * koskaan muuta projektin status-kenttää.
   */
  router.put(
    "/projects/:id/invoice",
    async (request, response) => {

      const projectId =
        Number(request.params.id)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Virheellinen projektin ID.",

          })

      }


      try {

        const existingInvoice =
          await prisma.invoice.findUnique({

            where: {
              projectId,
            },

          })


        if (!existingInvoice) {

          return response
            .status(400)
            .json({

              success: false,

              error:
                "Luo ensin lasku tarjouksesta.",

            })

        }


        const businessSettings =
          await getBusinessSettings(
            prisma
          )


        const scalars =
          parseInvoiceScalars(
            request.body,
            businessSettings,
          )


        const invoice =
          await prisma.invoice.update({

            where: {
              projectId,
            },

            data:
              scalars,

            include: {

              lineItems: {

                orderBy: {
                  createdAt: "asc",
                },

              },

            },

          })


        response.json({

          success: true,

          invoice,

        })

      } catch (error) {

        console.error(
          "Project invoice PUT error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Laskun tallentaminen epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects/:id/invoice/mark-paid
   */
  router.post(
    "/projects/:id/invoice/mark-paid",
    async (request, response) => {

      const projectId =
        Number(request.params.id)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Virheellinen projektin ID.",

          })

      }


      try {

        const existingInvoice =
          await prisma.invoice.findUnique({

            where: {
              projectId,
            },

          })


        if (!existingInvoice) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Laskua ei löytynyt.",

            })

        }


        const invoice =
          await prisma.invoice.update({

            where: {
              projectId,
            },

            data: {

              isPaid:
                true,

              paidAt:
                new Date(),

            },

          })


        response.json({

          success: true,

          invoice,

        })

      } catch (error) {

        console.error(
          "Project invoice mark-paid error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Merkitseminen epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects/:id/invoice/mark-unpaid
   */
  router.post(
    "/projects/:id/invoice/mark-unpaid",
    async (request, response) => {

      const projectId =
        Number(request.params.id)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Virheellinen projektin ID.",

          })

      }


      try {

        const existingInvoice =
          await prisma.invoice.findUnique({

            where: {
              projectId,
            },

          })


        if (!existingInvoice) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Laskua ei löytynyt.",

            })

        }


        const invoice =
          await prisma.invoice.update({

            where: {
              projectId,
            },

            data: {

              isPaid:
                false,

              paidAt:
                null,

            },

          })


        response.json({

          success: true,

          invoice,

        })

      } catch (error) {

        console.error(
          "Project invoice mark-unpaid error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Merkitseminen epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects/:id/invoice/items
   *
   * Lisää yhden rivin laskuun. Ei luo laskua taustalla -
   * laskun täytyy jo olla olemassa.
   */
  router.post(
    "/projects/:id/invoice/items",
    async (request, response) => {

      const projectId =
        Number(request.params.id)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Virheellinen projektin ID.",

          })

      }


      const {
        name,
        unit,
        quantity,
        unitPrice,
      } =
        request.body


      const cleanName =
        String(name || "").trim()


      if (!cleanName) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Rivin nimi ei voi olla tyhjä.",

          })

      }


      try {

        const invoice =
          await prisma.invoice.findUnique({

            where: {
              projectId,
            },

          })


        if (!invoice) {

          return response
            .status(400)
            .json({

              success: false,

              error:
                "Luo ensin lasku tarjouksesta.",

            })

        }


        const item =
          await prisma.invoiceLineItem.create({

            data: {

              invoiceId:
                invoice.id,

              name:
                cleanName,

              unit:
                unit
                  ? String(unit)
                  : "kpl",

              quantity:
                quantity !== undefined &&
                quantity !== null &&
                quantity !== ""
                  ? Number(quantity)
                  : 1,

              unitPrice:
                unitPrice !== undefined &&
                unitPrice !== null &&
                unitPrice !== ""
                  ? Number(unitPrice)
                  : 0,

            },

          })


        response.status(201).json({

          success: true,

          item,

          invoice,

        })

      } catch (error) {

        console.error(
          "Project invoice item POST error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Rivin lisääminen epäonnistui.",

        })

      }

    },
  )



  /*
   * PUT /api/projects/:id/invoice/items/:itemId
   */
  router.put(
    "/projects/:id/invoice/items/:itemId",
    async (request, response) => {

      const projectId =
        Number(request.params.id)

      const itemId =
        Number(request.params.itemId)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(itemId) ||
        itemId <= 0
      ) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Virheellinen tunniste.",

          })

      }


      try {

        const existingItem =
          await prisma.invoiceLineItem.findUnique({

            where: {
              id:
                itemId,
            },

            include: {

              invoice: true,

            },

          })


        if (
          !existingItem ||
          existingItem.invoice.projectId !== projectId
        ) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Riviä ei löytynyt.",

            })

        }


        const {
          name,
          unit,
          quantity,
          unitPrice,
        } =
          request.body


        const updateData = {}


        if (name !== undefined) {

          const cleanName =
            String(name).trim()


          if (!cleanName) {

            return response
              .status(400)
              .json({

                success: false,

                error:
                  "Rivin nimi ei voi olla tyhjä.",

              })

          }


          updateData.name =
            cleanName

        }


        if (unit !== undefined) {

          updateData.unit =
            String(unit || "kpl")

        }


        if (quantity !== undefined) {

          updateData.quantity =
            Number(quantity)

        }


        if (unitPrice !== undefined) {

          updateData.unitPrice =
            Number(unitPrice)

        }


        const item =
          await prisma.invoiceLineItem.update({

            where: {
              id:
                itemId,
            },

            data:
              updateData,

          })


        response.json({

          success: true,

          item,

        })

      } catch (error) {

        console.error(
          "Project invoice item PUT error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Rivin päivittäminen epäonnistui.",

        })

      }

    },
  )



  /*
   * DELETE /api/projects/:id/invoice/items/:itemId
   */
  router.delete(
    "/projects/:id/invoice/items/:itemId",
    async (request, response) => {

      const projectId =
        Number(request.params.id)

      const itemId =
        Number(request.params.itemId)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(itemId) ||
        itemId <= 0
      ) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Virheellinen tunniste.",

          })

      }


      try {

        const existingItem =
          await prisma.invoiceLineItem.findUnique({

            where: {
              id:
                itemId,
            },

            include: {

              invoice: true,

            },

          })


        if (
          !existingItem ||
          existingItem.invoice.projectId !== projectId
        ) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Riviä ei löytynyt.",

            })

        }


        await prisma.invoiceLineItem.delete({

          where: {
            id:
              itemId,
          },

        })


        response.json({

          success: true,

        })

      } catch (error) {

        console.error(
          "Project invoice item DELETE error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Rivin poistaminen epäonnistui.",

        })

      }

    },
  )



  /*
   * GET /api/invoices
   *
   * Kaikki laskut yli projektien, "Laskut"-listasivua varten.
   */
  router.get(
    "/invoices",
    async (request, response) => {

      try {

        const invoices =
          await prisma.invoice.findMany({

            include: {

              project: {

                include: {

                  customer: true,

                },

              },

              lineItems: true,

            },

            orderBy: {
              createdAt: "desc",
            },

          })


        const result =
          invoices.map(
            invoice => {

              const dueDate =
                new Date(
                  invoice.createdAt.getTime() +
                  invoice.dueDays * 24 * 60 * 60 * 1000
                )


              return {

                id:
                  invoice.id,

                invoiceNumber:
                  invoice.invoiceNumber,

                projectId:
                  invoice.projectId,

                projectName:
                  invoice.project?.name ||
                  "",

                customerName:
                  invoice.project?.customer?.name ||
                  "",

                customerCompany:
                  invoice.project?.customer?.company ||
                  "",

                createdAt:
                  invoice.createdAt,

                dueDate,

                isPaid:
                  invoice.isPaid,

                paidAt:
                  invoice.paidAt,

                total:
                  computeInvoiceTotal(
                    invoice
                  ),

              }

            }
          )


        response.json({

          success: true,

          invoices:
            result,

        })

      } catch (error) {

        console.error(
          "Invoices GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Laskujen haku epäonnistui.",

        })

      }

    },
  )



  return router
}
