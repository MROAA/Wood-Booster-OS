import express from "express"


const DEFAULT_STEPS =
  [
    "Suunnittelu",
    "Puun valinta",
    "Liimaus",
    "Jyrsintä",
    "Epoksi",
    "Hionta",
    "Pintakäsittely",
    "Toimitus",
  ]


export default function createProjectWorkflowRouter(
  prisma,
) {
  const router = express.Router()



  /*
   * GET /api/projects/:id/workflow
   *
   * Palauttaa projektin työvaiheet. Jos projektille ei ole
   * vielä koskaan luotu vaiheita, luo 8 oletusvaihetta ja
   * merkitsee sen tehdyksi (workflowSeededAt), jotta oletukset
   * eivät palaa takaisin jos käyttäjä poistaa ne kaikki.
   */
  router.get(
    "/projects/:id/workflow",
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
              workflowSeededAt: true,
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


        if (!project.workflowSeededAt) {

          const existingCount =
            await prisma.projectWorkflowStep.count({

              where: {
                projectId,
              },

            })


          if (existingCount === 0) {

            await prisma.$transaction([

              prisma.projectWorkflowStep.createMany({

                data:
                  DEFAULT_STEPS.map(
                    title => ({

                      projectId,

                      title,

                    })
                  ),

              }),

              prisma.project.update({

                where: {
                  id:
                    projectId,
                },

                data: {

                  workflowSeededAt:
                    new Date(),

                },

              }),

            ])

          }

        }


        const steps =
          await prisma.projectWorkflowStep.findMany({

            where: {
              projectId,
            },

            orderBy: {
              id: "asc",
            },

          })


        response.json({

          success: true,

          steps,

        })

      } catch (error) {

        console.error(
          "Project workflow GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Työvaiheiden haku epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects/:id/workflow
   *
   * Lisää vaiheen projektin työnkulkuun.
   */
  router.post(
    "/projects/:id/workflow",
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
        title,
      } =
        request.body


      const cleanTitle =
        String(title || "").trim()


      if (!cleanTitle) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Vaiheen nimi ei voi olla tyhjä.",

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


        const step =
          await prisma.projectWorkflowStep.create({

            data: {

              projectId,

              title:
                cleanTitle,

            },

          })


        response.status(201).json({

          success: true,

          step,

        })

      } catch (error) {

        console.error(
          "Project workflow POST error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Vaiheen lisääminen epäonnistui.",

        })

      }

    },
  )



  /*
   * PUT /api/projects/:id/workflow/:stepId
   *
   * Päivittää vaiheen valmiusasteen.
   */
  router.put(
    "/projects/:id/workflow/:stepId",
    async (request, response) => {

      const projectId =
        Number(request.params.id)

      const stepId =
        Number(request.params.stepId)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(stepId) ||
        stepId <= 0
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

        const existingStep =
          await prisma.projectWorkflowStep.findUnique({

            where: {
              id:
                stepId,
            },

          })


        if (
          !existingStep ||
          existingStep.projectId !== projectId
        ) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Vaihetta ei löytynyt.",

            })

        }


        const {
          done,
        } =
          request.body


        const step =
          await prisma.projectWorkflowStep.update({

            where: {
              id:
                stepId,
            },

            data: {

              done:
                Boolean(done),

            },

          })


        response.json({

          success: true,

          step,

        })

      } catch (error) {

        console.error(
          "Project workflow PUT error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Vaiheen päivittäminen epäonnistui.",

        })

      }

    },
  )



  /*
   * DELETE /api/projects/:id/workflow/:stepId
   *
   * Poistaa vaiheen projektin työnkulusta.
   */
  router.delete(
    "/projects/:id/workflow/:stepId",
    async (request, response) => {

      const projectId =
        Number(request.params.id)

      const stepId =
        Number(request.params.stepId)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(stepId) ||
        stepId <= 0
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

        const step =
          await prisma.projectWorkflowStep.findUnique({

            where: {
              id:
                stepId,
            },

          })


        if (
          !step ||
          step.projectId !== projectId
        ) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Vaihetta ei löytynyt.",

            })

        }


        await prisma.projectWorkflowStep.delete({

          where: {
            id:
              stepId,
          },

        })


        response.json({

          success: true,

        })

      } catch (error) {

        console.error(
          "Project workflow DELETE error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Vaiheen poistaminen epäonnistui.",

        })

      }

    },
  )



  return router
}
