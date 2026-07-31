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
        return response.status(400).json({
          success: false,
          error:
            "Virheellinen projektin ID.",
        })
      }

      try {
        const project =
          await prisma.project.findUnique({
            where: {
              id: projectId,
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
   *
   * Päivittää olemassa olevan projektin.
   *
   * Kaikki kentät ovat valinnaisia:
   *
   * {
   *   name,
   *   status,
   *   notes,
   *   customerId
   * }
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
        return response.status(400).json({
          success: false,
          error:
            "Virheellinen projektin ID.",
        })
      }

      const {
        name,
        status,
        notes,
        customerId,
      } = request.body


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

        updateData.name = cleanName
      }


      if (status !== undefined) {
        const cleanStatus =
          String(status).trim()

        if (!cleanStatus) {
          return response
            .status(400)
            .json({
              success: false,
              error:
                "Projektin tila ei voi olla tyhjä.",
            })
        }

        updateData.status =
          cleanStatus
      }


      if (notes !== undefined) {
        updateData.notes =
          notes === null
            ? null
            : String(notes)
      }


      if (customerId !== undefined) {
        if (
          customerId === null ||
          customerId === ""
        ) {
          updateData.customerId = null
        } else {
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

          updateData.customerId =
            parsedCustomerId
        }
      }


      if (
        Object.keys(updateData).length === 0
      ) {
        return response
          .status(400)
          .json({
            success: false,
            error:
              "Päivitettäviä tietoja ei annettu.",
          })
      }


      try {
        const existingProject =
          await prisma.project.findUnique({
            where: {
              id: projectId,
            },

            select: {
              id: true,
            },
          })

        if (!existingProject) {
          return response
            .status(404)
            .json({
              success: false,
              error:
                "Projektia ei löytynyt.",
            })
        }


        if (
          updateData.customerId !==
            undefined &&
          updateData.customerId !== null
        ) {
          const customer =
            await prisma.customer.findUnique({
              where: {
                id:
                  updateData.customerId,
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
        }


        const updatedProject =
          await prisma.project.update({
            where: {
              id: projectId,
            },

            data: updateData,

            include: {
              customer: true,
            },
          })


        response.json({
          success: true,
          project: updatedProject,
        })
      } catch (error) {
        console.error(
          "Project PUT error:",
          error,
        )

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
