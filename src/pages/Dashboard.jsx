import { useEffect, useState } from "react"

import { Link } from "react-router-dom"

import { apiGet } from "../api/client"

import DashboardHero from "../components/dashboard/DashboardHero"
import DashboardChat from "../components/dashboard/DashboardChat"



const REMINDER_LABELS = {

  deadline:
    "Määräaika",

  low_stock:
    "Materiaali",

  overdue_invoice:
    "Lasku",

  expired_quote:
    "Tarjous",

}



const REMINDER_TABS = {

  overdue_invoice:
    "invoice",

  expired_quote:
    "quote",

}



function Dashboard() {

  const [
    dashboard,
    setDashboard,
  ] = useState(null)


  const [
    reminders,
    setReminders,
  ] = useState(null)


  const [
    error,
    setError,
  ] = useState(null)



  useEffect(() => {

    async function loadDashboard() {

      try {

        const [
          data,
          remindersData,
        ] =
          await Promise.all([

            apiGet("/dashboard"),

            apiGet("/reminders")
              .catch(() => ({ reminders: [] })),

          ])


        setDashboard(data)


        setReminders(
          remindersData.reminders || []
        )


      } catch (error) {

        console.error(
          "Dashboard loading failed:",
          error,
        )


        setError(
          error.message,
        )

      }

    }


    loadDashboard()

  }, [])



  const summary =
    dashboard?.summary || {}



  return (

    <div
      className="
        h-full
        flex
        flex-col
        gap-4
      "
    >

      <DashboardHero />



      <section
        className="
          grid
          grid-cols-4
          gap-3
          shrink-0
        "
      >

        <div className="card p-3">

          <p className="text-xs text-[var(--wood-muted)]">
            PROJECTS
          </p>

          <p className="mt-1 text-lg">

            {summary.totalProjects ?? "..."}

          </p>

        </div>



        <div className="card p-3">

          <p className="text-xs text-[var(--wood-muted)]">
            SYSTEM PULSE
          </p>

          <p className="mt-1 text-lg text-[var(--wood-accent)]">
            ONLINE
          </p>

        </div>



        <div className="card p-3">

          <p className="text-xs text-[var(--wood-muted)]">
            CUSTOMERS
          </p>

          <p className="mt-1 text-lg">

            {summary.totalCustomers ?? "..."}

          </p>

        </div>



        <div className="card p-3">

          <p className="text-xs text-[var(--wood-muted)]">
            COMPLETED
          </p>

          <p className="mt-1 text-lg">

            {summary.completedProjects ?? "..."}

          </p>

        </div>


      </section>



      {
        reminders !== null && (

          <section
            className="
              card
              p-3
              shrink-0
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-2
              "
            >

              <p
                className="
                  text-xs
                  text-[var(--wood-muted)]
                "
              >
                HUOMIOITAVAA
              </p>


              {
                reminders.length > 0 && (

                  <span
                    className="
                      rounded-full
                      bg-[var(--wood-accent)]/10
                      px-2
                      py-0.5
                      text-xs
                      text-[var(--wood-accent)]
                    "
                  >
                    {reminders.length}
                  </span>

                )
              }

            </div>


            {
              reminders.length === 0

              ?

              (

                <p
                  className="
                    mt-2
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >

                  Ei huomioitavaa juuri nyt.

                </p>

              )

              :

              (

                <div
                  className="
                    mt-2
                    max-h-56
                    space-y-2
                    overflow-y-auto
                  "
                >

                  {
                    reminders.map(
                      (reminder, index) => (

                        <div

                          key={
                            `${reminder.type}-${index}`
                          }

                          className="
                            rounded-lg
                            bg-[var(--wood-panel)]
                            px-3
                            py-2
                            text-sm
                          "

                        >

                          <p
                            className="
                              text-xs
                              uppercase
                              tracking-wide
                              text-[var(--wood-muted)]
                            "
                          >

                            {
                              REMINDER_LABELS[reminder.type] ||
                              reminder.type
                            }

                          </p>


                          <p
                            className="
                              mt-1
                            "
                          >

                            {
                              reminder.projectId
                              ?

                              (

                                <Link

                                  to={
                                    REMINDER_TABS[reminder.type]
                                    ?
                                    `/projects/${reminder.projectId}?tab=${REMINDER_TABS[reminder.type]}`
                                    :
                                    `/projects/${reminder.projectId}`
                                  }

                                  className="
                                    text-[var(--wood-accent)]
                                    hover:opacity-80
                                  "

                                >

                                  {reminder.message}

                                </Link>

                              )

                              :

                              reminder.inventoryItemId

                              ?

                              (

                                <Link

                                  to="/inventory"

                                  className="
                                    text-[var(--wood-accent)]
                                    hover:opacity-80
                                  "

                                >

                                  {reminder.message}

                                </Link>

                              )

                              :

                              reminder.message

                            }

                          </p>


                        </div>

                      )
                    )
                  }

                </div>

              )

            }


          </section>

        )
      }



      {
        error && (

          <div
            className="
              card
              p-3
              text-sm
              text-red-400
            "
          >

            Dashboard error:
            {" "}
            {error}

          </div>

        )
      }



      <section
        className="
          flex-1
          min-h-0
        "
      >

        <DashboardChat />

      </section>


    </div>

  )

}


export default Dashboard
