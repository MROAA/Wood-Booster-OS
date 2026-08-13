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
          openWorkflowSteps,
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



            prisma.projectWorkflowStep.findMany({

              where: {

                done:
                  false,

                project: {

                  status: {
                    not: "Valmis",
                  },

                },

              },

              orderBy: [
                { projectId: "asc" },
                { id: "asc" },
              ],

              include: {

                project: {

                  select: {
                    id: true,
                    name: true,
                    deadline: true,
                  },

                },

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




        const seenProjectIds =
          new Set()

        const todayTasks =
          openWorkflowSteps

            .filter(
              (step) => {

                if (
                  seenProjectIds.has(
                    step.projectId,
                  )
                ) {

                  return false

                }


                seenProjectIds.add(
                  step.projectId,
                )

                return true

              },
            )

            .map(
              (step) => ({

                projectId:
                  step.project.id,

                projectName:
                  step.project.name,

                deadline:
                  step.project.deadline,

                stepId:
                  step.id,

                stepTitle:
                  step.title,

              }),
            )

            .sort(
              (a, b) => {

                if (
                  a.deadline &&
                  b.deadline
                ) {

                  return (
                    new Date(a.deadline) -
                    new Date(b.deadline)
                  )

                }


                if (a.deadline) {
                  return -1
                }


                if (b.deadline) {
                  return 1
                }


                return 0

              },
            )








        res.json({

          summary: {

            totalProjects,

            activeProjects:
              activeProjects.length,

            completedProjects:
              completedProjects.length,

            totalCustomers,

          },



          projects:


            projects.slice(
              0,
              10,
            ),




          customers,


          upcomingDeadlines,


          todayTasks,


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