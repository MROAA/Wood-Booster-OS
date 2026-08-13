import express from "express"


export default function createProjectTimelineRouter(
  prisma,
) {
  const router = express.Router()



  /*
   * GET /api/projects/:id/timeline
   *
   * Palauttaa projektin aikataulun tehtävät.
   */
  router.get(
    "/projects/:id/timeline",
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

        const tasks =
          await prisma.projectTimelineTask.findMany({

            where: {
              projectId,
            },

            orderBy: {
              createdAt: "asc",
            },

          })


        response.json({

          success: true,

          tasks,

        })

      } catch (error) {

        console.error(
          "Project timeline GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Aikataulun haku epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects/:id/timeline
   *
   * Lisää tehtävän projektin aikatauluun.
   */
  router.post(
    "/projects/:id/timeline",
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
        deadline,
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
              "Tehtävän nimi ei voi olla tyhjä.",

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


        const task =
          await prisma.projectTimelineTask.create({

            data: {

              projectId,

              name:
                cleanName,

              deadline:
                deadline
                  ? String(deadline)
                  : null,

            },

          })


        response.status(201).json({

          success: true,

          task,

        })

      } catch (error) {

        console.error(
          "Project timeline POST error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Tehtävän lisääminen epäonnistui.",

        })

      }

    },
  )



  /*
   * PUT /api/projects/:id/timeline/:taskId
   *
   * Päivittää tehtävän valmiusasteen.
   */
  router.put(
    "/projects/:id/timeline/:taskId",
    async (request, response) => {

      const projectId =
        Number(request.params.id)

      const taskId =
        Number(request.params.taskId)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(taskId) ||
        taskId <= 0
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

        const existingTask =
          await prisma.projectTimelineTask.findUnique({

            where: {
              id:
                taskId,
            },

          })


        if (
          !existingTask ||
          existingTask.projectId !== projectId
        ) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Tehtävää ei löytynyt.",

            })

        }


        const {
          completed,
        } =
          request.body


        const task =
          await prisma.projectTimelineTask.update({

            where: {
              id:
                taskId,
            },

            data: {

              completed:
                Boolean(completed),

            },

          })


        response.json({

          success: true,

          task,

        })

      } catch (error) {

        console.error(
          "Project timeline PUT error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Tehtävän päivittäminen epäonnistui.",

        })

      }

    },
  )



  /*
   * DELETE /api/projects/:id/timeline/:taskId
   *
   * Poistaa tehtävän projektin aikataulusta.
   */
  router.delete(
    "/projects/:id/timeline/:taskId",
    async (request, response) => {

      const projectId =
        Number(request.params.id)

      const taskId =
        Number(request.params.taskId)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(taskId) ||
        taskId <= 0
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

        const task =
          await prisma.projectTimelineTask.findUnique({

            where: {
              id:
                taskId,
            },

          })


        if (
          !task ||
          task.projectId !== projectId
        ) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Tehtävää ei löytynyt.",

            })

        }


        await prisma.projectTimelineTask.delete({

          where: {
            id:
              taskId,
          },

        })


        response.json({

          success: true,

        })

      } catch (error) {

        console.error(
          "Project timeline DELETE error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Tehtävän poistaminen epäonnistui.",

        })

      }

    },
  )



  return router
}
