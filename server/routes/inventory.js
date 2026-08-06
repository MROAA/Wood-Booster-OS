import express from "express"


export default function createInventoryRouter(prisma) {

  const router =
    express.Router()



  router.get(
    "/inventory",
    async (req, res) => {

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

    },
  )






  router.post(
    "/inventory",
    async (req, res) => {

      try {


        const name =
          String(
            req.body.name || "",
          ).trim()



        const category =
          String(
            req.body.category || "Muut",
          ).trim()



        const quantity =
          Number(
            req.body.quantity || 0,
          )



        const unit =
          String(
            req.body.unit || "kpl",
          ).trim()



        const unitPrice =
          Number(
            req.body.unitPrice || 0,
          )



        const minStock =
          req.body.minStock === undefined ||
          req.body.minStock === null ||
          req.body.minStock === ""
            ? null
            : Number(
                req.body.minStock,
              )



        const supplier =
          req.body.supplier
            ? String(
                req.body.supplier,
              ).trim()
            : null



        const notes =
          req.body.notes
            ? String(
                req.body.notes,
              ).trim()
            : null





        if (!name) {

          return res.status(400).json({

            error:
              "Materiaalin nimi puuttuu",

          })

        }



        if (
          !Number.isFinite(quantity) ||
          quantity < 0
        ) {

          return res.status(400).json({

            error:
              "Virheellinen määrä",

          })

        }



        if (
          !Number.isFinite(unitPrice) ||
          unitPrice < 0
        ) {

          return res.status(400).json({

            error:
              "Virheellinen hinta",

          })

        }



        if (
          minStock !== null &&
          (
            !Number.isFinite(minStock) ||
            minStock < 0
          )
        ) {

          return res.status(400).json({

            error:
              "Virheellinen hälytysraja",

          })

        }





        const item =
          await prisma.inventoryItem.create({

            data: {

              name,

              category,

              quantity,

              unit,

              unitPrice,

              minStock,

              supplier,

              notes,

            },

          })



        res.status(201).json(item)



      } catch (error) {

        console.error(error)


        res.status(500).json({

          error:
            error.message ||
            "Materiaalin lisääminen epäonnistui",

        })

      }

    },
  )








  router.put(
    "/inventory/:id",
    async (req, res) => {

      try {


        const itemId =
          Number(
            req.params.id,
          )



        if (
          !Number.isInteger(itemId) ||
          itemId <= 0
        ) {

          return res.status(400).json({

            error:
              "Virheellinen materiaalin ID",

          })

        }



        const existingItem =
          await prisma.inventoryItem.findUnique({

            where: {

              id:
                itemId,

            },

          })



        if (!existingItem) {

          return res.status(404).json({

            error:
              "Materiaalia ei löytynyt.",

          })

        }



        const data = {}




        if (
          req.body.name !== undefined
        ) {

          data.name =
            String(
              req.body.name,
            ).trim()

        }




        if (
          req.body.category !== undefined
        ) {

          data.category =
            String(
              req.body.category,
            ).trim()

        }




        if (
          req.body.quantity !== undefined
        ) {

          data.quantity =
            Number(
              req.body.quantity,
            )

        }




        if (
          req.body.unit !== undefined
        ) {

          data.unit =
            String(
              req.body.unit,
            ).trim()

        }




        if (
          req.body.unitPrice !== undefined
        ) {

          const unitPrice =
            Number(
              req.body.unitPrice,
            )


          if (
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
          ) {

            return res.status(400).json({

              error:
                "Virheellinen hinta",

            })

          }


          data.unitPrice = unitPrice

        }




        if (
          req.body.minStock !== undefined
        ) {

          const minStock =
            req.body.minStock === null ||
            req.body.minStock === ""
              ? null
              : Number(
                  req.body.minStock,
                )


          if (
            minStock !== null &&
            (
              !Number.isFinite(minStock) ||
              minStock < 0
            )
          ) {

            return res.status(400).json({

              error:
                "Virheellinen hälytysraja",

            })

          }


          data.minStock = minStock

        }




        if (
          req.body.supplier !== undefined
        ) {

          data.supplier =
            req.body.supplier
              ? String(
                  req.body.supplier,
                ).trim()
              : null

        }




        if (
          req.body.notes !== undefined
        ) {

          data.notes =
            req.body.notes
              ? String(
                  req.body.notes,
                ).trim()
              : null

        }






        const item =
          await prisma.inventoryItem.update({

            where: {

              id:
                itemId,

            },

            data,

          })



        res.json(item)



      } catch (error) {


        console.error(error)



        res.status(500).json({

          error:
            error.message ||
            "Materiaalin päivittäminen epäonnistui",

        })


      }

    },
  )









  router.delete(
    "/inventory/:id",
    async (req, res) => {

      try {


        const itemId =
          Number(
            req.params.id,
          )



        if (
          !Number.isInteger(itemId) ||
          itemId <= 0
        ) {

          return res.status(400).json({

            error:
              "Virheellinen materiaalin ID",

          })

        }



        const existingItem =
          await prisma.inventoryItem.findUnique({

            where: {

              id:
                itemId,

            },

          })



        if (!existingItem) {

          return res.status(404).json({

            error:
              "Materiaalia ei löytynyt.",

          })

        }



        await prisma.inventoryItem.delete({

          where: {

            id:
              itemId,

          },

        })



        res.json({

          success:
            true,

        })



      } catch (error) {


        console.error(error)



        res.status(500).json({

          error:
            error.message ||
            "Materiaalin poistaminen epäonnistui",

        })


      }

    },
  )





  return router

}
