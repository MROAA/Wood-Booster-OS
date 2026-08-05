import express from "express"


const STATUS_ORDER =
  [
    "Idea",
    "Suunnittelu",
    "Tarjous",
    "Tuotannossa",
    "Viimeistely",
    "Toimitus",
    "Valmis",
  ]


function shouldAdvanceToQuoteStatus(
  currentStatus
) {

  const currentIndex =
    STATUS_ORDER.indexOf(
      currentStatus
    )


  const targetIndex =
    STATUS_ORDER.indexOf(
      "Tarjous"
    )


  return (
    currentIndex !== -1 &&
    currentIndex < targetIndex
  )

}


async function getBusinessSettings(
  prisma
) {

  return await prisma.businessSettings.findUnique({

    where: {
      id: 1,
    },

  })

}


function generateQuoteNumber(
  quoteId,
  prefix
) {

  return (
    (prefix || "WB-Q") +
    String(quoteId).padStart(5, "0")
  )

}


function parseQuoteScalars(
  body,
  businessSettings
) {

  const {
    validDays,
    paymentTerms,
    deliveryTime,
    laborCost,
    otherCosts,
    customPrice,
  } =
    body || {}


  const defaultValidDays =
    businessSettings?.defaultValidDays ??
    14

  const defaultPaymentTerms =
    businessSettings?.defaultPaymentTerms ||
    "14 pv netto"


  const scalars = {}


  if (validDays !== undefined) {

    const parsedValidDays =
      Number(validDays)


    scalars.validDays =
      Number.isFinite(parsedValidDays) &&
      parsedValidDays >= 0
        ? Math.round(parsedValidDays)
        : defaultValidDays

  }


  if (paymentTerms !== undefined) {

    scalars.paymentTerms =
      String(paymentTerms || "").trim() ||
      defaultPaymentTerms

  }


  if (deliveryTime !== undefined) {

    scalars.deliveryTime =
      String(deliveryTime || "").trim() ||
      null

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


export default function createProjectQuoteRouter(
  prisma,
) {
  const router = express.Router()



  /*
   * GET /api/projects/:id/quote
   *
   * Palauttaa projektin tarjouksen riveineen, tai
   * {success:true, quote:null} jos tarjousta ei ole vielä.
   */
  router.get(
    "/projects/:id/quote",
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


        response.json({

          success: true,

          quote:
            quote || null,

        })

      } catch (error) {

        console.error(
          "Project quote GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Tarjouksen haku epäonnistui.",

        })

      }

    },
  )



  /*
   * PUT /api/projects/:id/quote
   *
   * Tallentaa/luo tarjouksen perustiedot. Vain tämä reitti
   * voi edistää projektin tilaa "Tarjous"-tilaan.
   */
  router.put(
    "/projects/:id/quote",
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


        const businessSettings =
          await getBusinessSettings(
            prisma
          )


        const scalars =
          parseQuoteScalars(
            request.body,
            businessSettings,
          )


        const existingQuote =
          await prisma.quote.findUnique({

            where: {
              projectId,
            },

          })


        let quote


        if (existingQuote) {

          quote =
            await prisma.quote.update({

              where: {
                projectId,
              },

              data:
                scalars,

            })

        }

        else {

          const created =
            await prisma.quote.create({

              data: {

                projectId,

                quoteNumber:
                  "",

                validDays:
                  businessSettings?.defaultValidDays ??
                  14,

                paymentTerms:
                  businessSettings?.defaultPaymentTerms ||
                  "14 pv netto",

                ...scalars,

              },

            })


          quote =
            await prisma.quote.update({

              where: {
                id:
                  created.id,
              },

              data: {

                quoteNumber:
                  generateQuoteNumber(
                    created.id,
                    businessSettings?.quoteNumberPrefix,
                  ),

              },

            })

        }


        let updatedProject =
          project


        if (
          shouldAdvanceToQuoteStatus(
            project.status
          )
        ) {

          updatedProject =
            await prisma.project.update({

              where: {
                id:
                  projectId,
              },

              data: {

                status:
                  "Tarjous",

              },

              include: {

                customer: true,

              },

            })

        }

        else {

          updatedProject =
            await prisma.project.findUnique({

              where: {
                id:
                  projectId,
              },

              include: {

                customer: true,

              },

            })

        }


        response.json({

          success: true,

          quote,

          project:
            updatedProject,

        })

      } catch (error) {

        console.error(
          "Project quote PUT error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Tarjouksen tallentaminen epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects/:id/quote/items
   *
   * Lisää yhden rivin tarjoukseen. Luo tarjouksen taustalla
   * jos sitä ei vielä ole (ei tilanmuutosta tässä).
   */
  router.post(
    "/projects/:id/quote/items",
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


        let quote =
          await prisma.quote.findUnique({

            where: {
              projectId,
            },

          })


        if (!quote) {

          const businessSettings =
            await getBusinessSettings(
              prisma
            )


          const created =
            await prisma.quote.create({

              data: {

                projectId,

                quoteNumber:
                  "",

              },

            })


          quote =
            await prisma.quote.update({

              where: {
                id:
                  created.id,
              },

              data: {

                quoteNumber:
                  generateQuoteNumber(
                    created.id,
                    businessSettings?.quoteNumberPrefix,
                  ),

              },

            })

        }


        const item =
          await prisma.quoteLineItem.create({

            data: {

              quoteId:
                quote.id,

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

          quote,

        })

      } catch (error) {

        console.error(
          "Project quote item POST error:",
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
   * PUT /api/projects/:id/quote/items/:itemId
   *
   * Muokkaa yhtä tarjousriviä.
   */
  router.put(
    "/projects/:id/quote/items/:itemId",
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
          await prisma.quoteLineItem.findUnique({

            where: {
              id:
                itemId,
            },

            include: {

              quote: true,

            },

          })


        if (
          !existingItem ||
          existingItem.quote.projectId !== projectId
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
          await prisma.quoteLineItem.update({

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
          "Project quote item PUT error:",
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
   * DELETE /api/projects/:id/quote/items/:itemId
   *
   * Poistaa tarjousrivin.
   */
  router.delete(
    "/projects/:id/quote/items/:itemId",
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
          await prisma.quoteLineItem.findUnique({

            where: {
              id:
                itemId,
            },

            include: {

              quote: true,

            },

          })


        if (
          !existingItem ||
          existingItem.quote.projectId !== projectId
        ) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Riviä ei löytynyt.",

            })

        }


        await prisma.quoteLineItem.delete({

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
          "Project quote item DELETE error:",
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
   * POST /api/projects/:id/quote/import-materials
   *
   * Tuo projektin nykyiset materiaalit tarjousriveiksi.
   */
  router.post(
    "/projects/:id/quote/import-materials",
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


        let quote =
          await prisma.quote.findUnique({

            where: {
              projectId,
            },

          })


        if (!quote) {

          const businessSettings =
            await getBusinessSettings(
              prisma
            )


          const created =
            await prisma.quote.create({

              data: {

                projectId,

                quoteNumber:
                  "",

              },

            })


          quote =
            await prisma.quote.update({

              where: {
                id:
                  created.id,
              },

              data: {

                quoteNumber:
                  generateQuoteNumber(
                    created.id,
                    businessSettings?.quoteNumberPrefix,
                  ),

              },

            })

        }


        const materials =
          await prisma.projectMaterial.findMany({

            where: {
              projectId,
            },

          })


        if (materials.length > 0) {

          await prisma.quoteLineItem.createMany({

            data:
              materials.map(
                material => ({

                  quoteId:
                    quote.id,

                  name:
                    material.name,

                  unit:
                    material.unit,

                  quantity:
                    material.quantity,

                  unitPrice:
                    material.unitPrice,

                })
              ),

          })

        }


        const lineItems =
          await prisma.quoteLineItem.findMany({

            where: {
              quoteId:
                quote.id,
            },

            orderBy: {
              createdAt: "asc",
            },

          })


        response.json({

          success: true,

          quote,

          lineItems,

        })

      } catch (error) {

        console.error(
          "Project quote import-materials error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Materiaalien tuominen epäonnistui.",

        })

      }

    },
  )



  return router
}
