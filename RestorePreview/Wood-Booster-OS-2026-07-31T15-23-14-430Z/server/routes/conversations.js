import express from "express"



export default function createConversationRouter(
  prisma,
) {

  const router = express.Router()



  /*
    Hae kaikki keskustelut
  */

  router.get(
    "/conversations",
    async (req, res) => {

      try {

        const conversations =
          await prisma.conversation.findMany({

            orderBy: {

              updatedAt:
                "desc",

            },


            take:
              50,

          })



        res.json(
          conversations,
        )


      } catch (error) {

        res.status(500).json({

          error:
            error.message,

        })

      }

    },
  )





  /*
    Hae yksi keskustelu viesteineen
  */

  router.get(
    "/conversations/:id",
    async (req, res) => {

      try {

        const conversation =
          await prisma.conversation.findUnique({

            where: {

              id:
                req.params.id,

            },


            include: {

              messages: {

                orderBy: {

                  createdAt:
                    "asc",

                },

              },

            },

          })



        if (!conversation) {

          return res.status(404).json({

            error:
              "Keskustelua ei löytynyt.",

          })

        }



        res.json(
          conversation,
        )


      } catch (error) {

        res.status(500).json({

          error:
            error.message,

        })

      }

    },
  )







  /*
    Luo uusi keskustelu
  */

  router.post(
    "/conversations",
    async (req, res) => {

      try {


        const title =
          req.body.title ||
          "Uusi keskustelu"



        const conversation =
          await prisma.conversation.create({

            data: {

              title,

            },

          })



        res.json(
          conversation,
        )


      } catch (error) {

        res.status(500).json({

          error:
            error.message,

        })

      }

    },
  )






  /*
    Poista keskustelu
  */

  router.delete(
    "/conversations/:id",
    async (req, res) => {

      try {


        await prisma.conversation.delete({

          where: {

            id:
              req.params.id,

          },

        })



        res.json({

          success:
            true,

        })


      } catch (error) {

        res.status(500).json({

          error:
            error.message,

        })

      }

    },
  )





  return router

}