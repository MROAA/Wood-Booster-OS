import { useEffect, useState } from "react"

import { apiGet } from "../api/client"

import DashboardHero from "../components/dashboard/DashboardHero"
import DashboardChat from "../components/dashboard/DashboardChat"



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
