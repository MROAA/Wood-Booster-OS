import express from "express"


export default function createProjectNotesRouter(
  prisma,
) {
  const router = express.Router()



  /*
   * GET /api/projects/:id/notes
   *
   * Palauttaa projektin muistiinpanot.
   */
  router.get(
    "/projects/:id/notes",
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

        const notes =
          await prisma.note.findMany({

            where: {
              projectId,
            },

            orderBy: {
              createdAt: "desc",
            },

          })


        response.json({

          success: true,

          notes,

        })

      } catch (error) {

        console.error(
          "Project notes GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Muistiinpanojen haku epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects/:id/notes
   *
   * Lisää muistiinpanon projektille.
   */
  router.post(
    "/projects/:id/notes",
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
        content,
      } =
        request.body


      const cleanContent =
        String(content || "").trim()


      if (!cleanContent) {

        return response
          .status(400)
          .json({

            success: false,

            error:
              "Muistiinpanon sisältö ei voi olla tyhjä.",

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


        const note =
          await prisma.note.create({

            data: {

              projectId,

              title:
                title
                  ? String(title).trim()
                  : null,

              content:
                cleanContent,

            },

          })


        response.status(201).json({

          success: true,

          note,

        })

      } catch (error) {

        console.error(
          "Project notes POST error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Muistiinpanon lisääminen epäonnistui.",

        })

      }

    },
  )



  /*
   * DELETE /api/projects/:id/notes/:noteId
   *
   * Poistaa muistiinpanon projektilta.
   */
  router.delete(
    "/projects/:id/notes/:noteId",
    async (request, response) => {

      const projectId =
        Number(request.params.id)

      const noteId =
        Number(request.params.noteId)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(noteId) ||
        noteId <= 0
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

        const note =
          await prisma.note.findUnique({

            where: {
              id:
                noteId,
            },

          })


        if (
          !note ||
          note.projectId !== projectId
        ) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Muistiinpanoa ei löytynyt.",

            })

        }


        await prisma.note.delete({

          where: {
            id:
              noteId,
          },

        })


        response.json({

          success: true,

        })

      } catch (error) {

        console.error(
          "Project notes DELETE error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Muistiinpanon poistaminen epäonnistui.",

        })

      }

    },
  )



  return router
}
