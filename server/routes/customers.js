import express from "express"


export default function createCustomersRouter(
  prisma,
) {

  const router =
    express.Router()



  router.get(
    "/customers",
    async (req, res) => {

      try {

        const customers =
          await prisma.customer.findMany({

            include: {
              projects: true,
            },

            orderBy: {
              name: "asc",
            },

          })


        res.json(customers)


      } catch (error) {

        console.error(error)


        res.status(500).json({

          error:
            error.message ||
            "Asiakkaiden lataaminen epäonnistui",

        })

      }

    },
  )






  router.post(
    "/customers",
    async (req, res) => {

      try {

        const name =
          String(
            req.body.name || "",
          ).trim()


        if (!name) {

          return res.status(400).json({

            error:
              "Asiakkaan nimi puuttuu",

          })

        }



        const customer =
          await prisma.customer.create({

            data: {

              name,

              company:
                req.body.company?.trim() ||
                null,


              email:
                req.body.email?.trim() ||
                null,


              phone:
                req.body.phone?.trim() ||
                null,


              notes:
                req.body.notes?.trim() ||
                null,

            },

          })



        res.status(201).json(customer)


      } catch (error) {

        console.error(error)


        res.status(500).json({

          error:
            error.message ||
            "Asiakkaan lisääminen epäonnistui",

        })

      }

    },
  )







  router.put(
    "/customers/:id",
    async (req, res) => {

      try {

        const customerId =
          Number(
            req.params.id,
          )



        if (
          !Number.isInteger(customerId)
        ) {

          return res.status(400).json({

            error:
              "Virheellinen asiakkaan ID",

          })

        }



        const data = {}



        if (
          req.body.name !== undefined
        ) {

          const name =
            String(
              req.body.name,
            ).trim()


          if (!name) {

            return res.status(400).json({

              error:
                "Asiakkaan nimi puuttuu",

            })

          }


          data.name = name

        }





        if (
          req.body.company !== undefined
        ) {

          data.company =
            String(
              req.body.company,
            ).trim() || null

        }



        if (
          req.body.email !== undefined
        ) {

          data.email =
            String(
              req.body.email,
            ).trim() || null

        }



        if (
          req.body.phone !== undefined
        ) {

          data.phone =
            String(
              req.body.phone,
            ).trim() || null

        }



        if (
          req.body.notes !== undefined
        ) {

          data.notes =
            String(
              req.body.notes,
            ).trim() || null

        }




        const customer =
          await prisma.customer.update({

            where: {

              id:
                customerId,

            },

            data,

          })



        res.json(customer)


      } catch (error) {

        console.error(error)


        res.status(500).json({

          error:
            error.message ||
            "Asiakkaan päivittäminen epäonnistui",

        })

      }

    },
  )








  router.delete(
    "/customers/:id",
    async (req, res) => {

      try {

        const customerId =
          Number(
            req.params.id,
          )



        await prisma.customer.delete({

          where: {

            id:
              customerId,

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
            "Asiakkaan poistaminen epäonnistui",

        })

      }

    },
  )





  return router

}
