import express from "express"


export default function createAIRouter(prisma) {

  const router = express.Router()



  router.post(
    "/ai/generate-project",
    async (req, res) => {

      try {

        const customerName =
          String(
            req.body.customerName || "",
          ).trim()


        const projectName =
          String(
            req.body.projectName || "",
          ).trim()


        const description =
          String(
            req.body.description || "",
          ).trim()


        const woodType =
          String(
            req.body.woodType || "Tammi",
          ).trim()


        const style =
          String(
            req.body.style || "Skandinaavinen",
          ).trim()



        if (!projectName) {

          return res.status(400).json({

            error:
              "Projektin nimi puuttuu"

          })

        }



        if (!description) {

          return res.status(400).json({

            error:
              "Projektin kuvaus puuttuu"

          })

        }



        let customer = null



        if (customerName) {

          customer =
            await prisma.customer.findFirst({

              where: {
                name: customerName
              }

            })


          if (!customer) {

            customer =
              await prisma.customer.create({

                data: {

                  name: customerName

                }

              })

          }

        }





        const project =
          await prisma.project.create({

            data: {

              name:
                projectName,


              status:
                "Suunnittelu",


              notes:
                [
                  "AI-luotu projekti",
                  `Kuvaus: ${description}`,
                  `Puulaji: ${woodType}`,
                  `Tyyli: ${style}`,
                ].join("\n"),



              customer:
                customer
                ?
                {
                  connect: {
                    id: customer.id
                  }
                }
                :
                undefined

            }

          })





        res.status(201).json({

          success: true,

          projectId:
            project.id,

          project

        })


      }

      catch(error) {


        console.error(
          "AI PROJECT ERROR:",
          error
        )


        res.status(500).json({

          error:
            error.message ||
            "Projektin luonti epäonnistui"

        })

      }


    }

  )



  return router

}
