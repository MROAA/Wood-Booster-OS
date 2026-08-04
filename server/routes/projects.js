import express from "express"


export default function createProjectsRouter(
  prisma,
) {
  const router = express.Router()



  /*
   * GET /api/projects
   *
   * Palauttaa kaikki projektit.
   */
  router.get(
    "/projects",
    async (request, response) => {

      try {

        const projects =
          await prisma.project.findMany({

            include: {
              customer: true,
            },

            orderBy: {
              updatedAt: "desc",
            },

          })


        response.json(projects)


      } catch (error) {

        console.error(
          "Projects GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Projektien hakeminen epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects
   *
   * Luo uuden projektin.
   */
  router.post(
    "/projects",
    async (request, response) => {

      const {
        name,
        status,
        notes,
        customerId,
      } = request.body



      const cleanName =
        String(name || "").trim()


      if (!cleanName) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Projektin nimi ei voi olla tyhjä.",

          })

      }



      try {

        const projectData = {

          name:
            cleanName,

          status:
            status
              ? String(status)
              : "Suunnittelu",

          notes:
            notes || null,

        }



        if (
          customerId !== undefined &&
          customerId !== null &&
          customerId !== ""
        ) {

          const parsedCustomerId =
            Number(customerId)


          if (
            !Number.isInteger(
              parsedCustomerId,
            ) ||
            parsedCustomerId <= 0
          ) {

            return response
              .status(400)
              .json({

                success: false,

                error:
                  "Virheellinen asiakkaan ID.",

              })

          }


          const customer =
            await prisma.customer.findUnique({

              where: {
                id:
                  parsedCustomerId,
              },

              select: {
                id: true,
              },

            })


          if (!customer) {

            return response
              .status(404)
              .json({

                success: false,

                error:
                  "Valittua asiakasta ei löytynyt.",

              })

          }


          projectData.customerId =
            parsedCustomerId

        }



        const project =
          await prisma.project.create({

            data:
              projectData,


            include: {

              customer: true,

            },

          })



        response.status(201).json({

          success: true,

          project,

        })


      } catch (error) {

        console.error(
          "Project POST error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Projektin luominen epäonnistui.",

        })

      }

    },
  )



  /*
   * GET /api/projects/:id
   *
   * Palauttaa yhden projektin.
   */
  router.get(
    "/projects/:id",
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


            include: {

              customer: true,

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



        response.json(project)



      } catch (error) {

        console.error(
          "Project GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Projektin hakeminen epäonnistui.",

        })

      }

    },
  )



  /*
   * PUT /api/projects/:id
   */
  router.put(
    "/projects/:id",
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
        status,
        notes,
        deadline,
        description,
        customerId,
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
                "Projektin nimi ei voi olla tyhjä.",

            })

        }


        updateData.name =
          cleanName

      }



      if (status !== undefined) {

        updateData.status =
          String(status)

      }



      if (notes !== undefined) {

        updateData.notes =
          notes === null
            ? null
            : String(notes)

      }



      if (deadline !== undefined) {

        updateData.deadline =
          deadline
            ? new Date(deadline)
            : null

      }



      if (description !== undefined) {

        updateData.description =
          description === null
            ? null
            : String(description)

      }



      if (customerId !== undefined) {

        if (
          customerId === null ||
          customerId === ""
        ) {

          updateData.customerId =
            null

        }

        else {

          const parsedCustomerId =
            Number(customerId)


          if (
            !Number.isInteger(
              parsedCustomerId,
            ) ||
            parsedCustomerId <= 0
          ) {

            return response
              .status(400)
              .json({

                success: false,

                error:
                  "Virheellinen asiakkaan ID.",

              })

          }


          const customer =
            await prisma.customer.findUnique({

              where: {
                id:
                  parsedCustomerId,
              },

              select: {
                id: true,
              },

            })


          if (!customer) {

            return response
              .status(404)
              .json({

                success: false,

                error:
                  "Valittua asiakasta ei löytynyt.",

              })

          }


          updateData.customerId =
            parsedCustomerId

        }

      }



      try {

        const updatedProject =
          await prisma.project.update({

            where: {
              id:
                projectId,
            },


            data:
              updateData,


            include: {

              customer: true,

            },

          })


        response.json({

          success: true,

          project:
            updatedProject,

        })

      } catch (error) {

        console.error(
          "Project PUT error:",
          error,
        )


        if (error.code === "P2025") {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Projektia ei löytynyt.",

            })

        }


        response.status(500).json({

          success: false,

          error:
            "Projektin päivittäminen epäonnistui.",

        })

      }

    },
  )



  return router
}
