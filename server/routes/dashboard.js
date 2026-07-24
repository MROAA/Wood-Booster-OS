import express from "express"



export default function createDashboardRouter(prisma) {

  const router =
    express.Router()





  router.get(
    "/dashboard",
    async (req, res) => {

      try {


        const [
          projects,
          customers,
        ] =
          await Promise.all([


            prisma.project.findMany({

              include: {

                customer:
                  true,

              },


              orderBy: {

                updatedAt:
                  "desc",

              },


            }),





            prisma.customer.findMany({

              orderBy: {

                name:
                  "asc",

              },

            }),


          ])







        const activeProjects =
          projects.filter(
            (project) =>
              project.status !== "Valmis",
          )




        const completedProjects =
          projects.filter(
            (project) =>
              project.status === "Valmis",
          )






        const totalProjects =
          projects.length





        const totalCustomers =
          customers.length





        const estimatedRevenue =
          projects.reduce(
            (sum, project) => {

              return (
                sum +
                Number(
                  project.price ||
                  project.totalPrice ||
                  0,
                )
              )

            },
            0,
          )







        const upcomingDeadlines =
          projects

            .filter(
              (project) =>
                project.deadline,
            )


            .sort(
              (a, b) =>
                new Date(
                  a.deadline,
                ) -
                new Date(
                  b.deadline,
                ),
            )


            .slice(
              0,
              5,
            )








        res.json({

          summary: {

            totalProjects,

            activeProjects:
              activeProjects.length,

            completedProjects:
              completedProjects.length,

            totalCustomers,

            estimatedRevenue,

          },



          projects:


            projects.slice(
              0,
              10,
            ),




          customers,


          upcomingDeadlines,


        })





      } catch (error) {


        console.error(
          "Dashboard error:",
          error,
        )



        res.status(500).json({

          error:
            error.message ||
            "Dashboardia ei voitu ladata.",

        })


      }


    },
  )





  return router

}