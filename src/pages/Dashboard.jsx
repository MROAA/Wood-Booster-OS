import DashboardHero from "../components/dashboard/DashboardHero"
import DashboardSummary from "../components/dashboard/DashboardSummary"
import DashboardChat from "../components/dashboard/DashboardChat"



function Dashboard() {

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


      <DashboardSummary />


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
