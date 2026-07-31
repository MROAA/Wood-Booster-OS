import { useEffect, useState } from "react"

import { apiGet } from "../api/client"

import DashboardHero from "../components/dashboard/DashboardHero"
import DashboardChat from "../components/dashboard/DashboardChat"
import DashboardWorkspaceStatus from "../components/dashboard/DashboardWorkspaceStatus"



function Dashboard() {

  const [
    dashboard,
    setDashboard,
  ] = useState(null)


  const [
    error,
    setError,
  ] = useState(null)



  useEffect(() => {

    async function loadDashboard() {

      try {

        const data =
          await apiGet("/dashboard")


        setDashboard(data)


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
          h-[420px]
          shrink-0
        "
      >

        <DashboardChat />

      </section>



      <section
        className="
          card
          p-5
          shrink-0
        "
      >

        <h2
          className="
            text-sm
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          System Activity
        </h2>



        <div
          className="
            mt-4
            grid
            grid-cols-3
            gap-3
          "
        >

          <div
            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              p-4
            "
          >

            <p className="text-xs text-[var(--wood-muted)]">
              RUNTIME
            </p>

            <p className="mt-2">
              Linux
            </p>

          </div>



          <div
            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              p-4
            "
          >

            <p className="text-xs text-[var(--wood-muted)]">
              MODULES
            </p>

            <p className="mt-2">
              Spacemonkey
            </p>

          </div>



          <div
            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              p-4
            "
          >

            <p className="text-xs text-[var(--wood-muted)]">
              EVENTS
            </p>

            <p className="mt-2">
              System Online
            </p>

          </div>


        </div>


      </section>



      <DashboardWorkspaceStatus />


    </div>

  )

}


export default Dashboard
