import express from "express"


export default function createProjectMaterialsRouter(
  prisma,
) {
  const router = express.Router()



  /*
   * GET /api/projects/:id/materials
   *
   * Palauttaa projektin materiaalit.
   */
  router.get(
    "/projects/:id/materials",
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

        const materials =
          await prisma.projectMaterial.findMany({

            where: {
              projectId,
            },

            orderBy: {
              createdAt: "asc",
            },

          })


        response.json({

          success: true,

          materials,

        })

      } catch (error) {

        console.error(
          "Project materials GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Materiaalien haku epäonnistui.",

        })

      }

    },
  )



  /*
   * POST /api/projects/:id/materials
   *
   * Lisää materiaalin projektille.
   */
  router.post(
    "/projects/:id/materials",
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
        category,
        unit,
        quantity,
        unitPrice,
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
              "Materiaalin nimi ei voi olla tyhjä.",

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


        const material =
          await prisma.projectMaterial.create({

            data: {

              projectId,

              name:
                cleanName,

              category:
                category
                  ? String(category)
                  : null,

              unit:
                unit
                  ? String(unit)
                  : "kpl",

              quantity:
                quantity !== undefined &&
                quantity !== null &&
                quantity !== ""
                  ? Number(quantity)
                  : 1,

              unitPrice:
                unitPrice !== undefined &&
                unitPrice !== null &&
                unitPrice !== ""
                  ? Number(unitPrice)
                  : 0,

            },

          })


        response.status(201).json({

          success: true,

          material,

        })

      } catch (error) {

        console.error(
          "Project materials POST error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Materiaalin lisääminen epäonnistui.",

        })

      }

    },
  )



  /*
   * DELETE /api/projects/:id/materials/:materialId
   *
   * Poistaa materiaalin projektilta.
   */
  router.delete(
    "/projects/:id/materials/:materialId",
    async (request, response) => {

      const projectId =
        Number(request.params.id)

      const materialId =
        Number(request.params.materialId)


      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(materialId) ||
        materialId <= 0
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

        const material =
          await prisma.projectMaterial.findUnique({

            where: {
              id:
                materialId,
            },

          })


        if (
          !material ||
          material.projectId !== projectId
        ) {

          return response
            .status(404)
            .json({

              success: false,

              error:
                "Materiaalia ei löytynyt.",

            })

        }


        await prisma.projectMaterial.delete({

          where: {
            id:
              materialId,
          },

        })


        response.json({

          success: true,

        })

      } catch (error) {

        console.error(
          "Project materials DELETE error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Materiaalin poistaminen epäonnistui.",

        })

      }

    },
  )



  return router
}
