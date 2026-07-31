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






        const item =
          await prisma.inventoryItem.create({

            data: {

              name,

              category,

              quantity,

              unit,

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
