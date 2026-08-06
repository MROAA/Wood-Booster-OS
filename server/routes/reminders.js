import express from "express"


function formatDate(
  date
) {

  return new Intl.DateTimeFormat(
    "fi-FI"
  )
  .format(date)

}


export default function createRemindersRouter(
  prisma,
) {
  const router = express.Router()



  /*
   * GET /api/reminders
   *
   * Kokoaa neljä automaattista muistutusta yhteen listaan:
   * myöhässä olevat projektit, vähissä olevat materiaalit,
   * myöhässä maksamattomat laskut, ja vanhentuneet tarjoukset
   * joita ei ole vielä muutettu laskuksi. Lasketaan aina
   * pyynnön hetkellä, ei taustaprosessia.
   */
  router.get(
    "/reminders",
    async (request, response) => {

      try {

        const now =
          new Date()


        const [
          overdueProjects,
          lowStockItems,
          unpaidInvoices,
          quotes,
        ] =
          await Promise.all([

            prisma.project.findMany({

              where: {

                deadline: {
                  lt: now,
                },

                status: {
                  not: "Valmis",
                },

              },

              orderBy: {
                deadline: "asc",
              },

            }),


            prisma.inventoryItem.findMany({

              where: {

                minStock: {
                  not: null,
                },

              },

            }),


            prisma.invoice.findMany({

              where: {
                isPaid: false,
              },

              include: {

                project: {

                  include: {
                    customer: true,
                  },

                },

              },

            }),


            prisma.quote.findMany({

              include: {

                project: {

                  include: {

                    invoice: true,

                    customer: true,

                  },

                },

              },

            }),

          ])



        const reminders = []


        for (const project of overdueProjects) {

          reminders.push({

            type: "deadline",

            message:
              `Projekti "${project.name}" on myöhässä aikataulusta ` +
              `(määräaika ${formatDate(new Date(project.deadline))}).`,

            projectId:
              project.id,

            inventoryItemId:
              null,

            severity:
              "warning",

          })

        }



        const flaggedLowStock =
          lowStockItems
            .filter(
              item =>
                item.quantity < item.minStock
            )
            .sort(
              (a, b) =>
                (a.quantity - a.minStock) -
                (b.quantity - b.minStock)
            )


        for (const item of flaggedLowStock) {

          reminders.push({

            type: "low_stock",

            message:
              `"${item.name}" on vähissä: ${item.quantity} ${item.unit} ` +
              `jäljellä (hälytysraja ${item.minStock} ${item.unit}).`,

            projectId:
              null,

            inventoryItemId:
              item.id,

            severity:
              "warning",

          })

        }



        const overdueInvoices =
          unpaidInvoices
            .map(
              invoice => ({

                ...invoice,

                dueDate:
                  new Date(
                    new Date(invoice.createdAt).getTime() +
                    invoice.dueDays * 24 * 60 * 60 * 1000
                  ),

              })
            )
            .filter(
              invoice =>
                invoice.dueDate.getTime() < now.getTime()
            )
            .sort(
              (a, b) =>
                a.dueDate - b.dueDate
            )


        for (const invoice of overdueInvoices) {

          reminders.push({

            type: "overdue_invoice",

            message:
              `Lasku ${invoice.invoiceNumber} ` +
              `(${invoice.project?.name || "tuntematon projekti"}) ` +
              `on erääntynyt ${formatDate(invoice.dueDate)} ` +
              "eikä ole vielä maksettu.",

            projectId:
              invoice.projectId,

            inventoryItemId:
              null,

            severity:
              "warning",

          })

        }



        const expiredQuotes =
          quotes
            .map(
              quote => ({

                ...quote,

                expiresAt:
                  new Date(
                    new Date(quote.createdAt).getTime() +
                    quote.validDays * 24 * 60 * 60 * 1000
                  ),

              })
            )
            .filter(
              quote =>
                quote.expiresAt.getTime() < now.getTime() &&
                !quote.project?.invoice
            )
            .sort(
              (a, b) =>
                a.expiresAt - b.expiresAt
            )


        for (const quote of expiredQuotes) {

          reminders.push({

            type: "expired_quote",

            message:
              `Tarjous ${quote.quoteNumber} ` +
              `(${quote.project?.name || "tuntematon projekti"}) ` +
              `on vanhentunut ${formatDate(quote.expiresAt)} ` +
              "eikä sitä ole muutettu laskuksi.",

            projectId:
              quote.projectId,

            inventoryItemId:
              null,

            severity:
              "warning",

          })

        }



        response.json({

          success: true,

          reminders,

        })

      } catch (error) {

        console.error(
          "Reminders GET error:",
          error,
        )


        response.status(500).json({

          success: false,

          error:
            "Muistutusten haku epäonnistui.",

        })

      }

    },
  )



  return router
}
