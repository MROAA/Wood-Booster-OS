import DashboardChat from "../components/dashboard/DashboardChat"
import BoosterverseDesktop from "./BoosterverseDesktop"



function Dashboard() {

  return (

    <div
      className="
        flex
        h-full
        min-h-0
        gap-4
      "
    >

      <section
        className="
          w-2/5
          min-w-0
        "
      >

        <DashboardChat />

      </section>


      <section
        className="
          w-3/5
          min-w-0
          rounded-2xl
          border
          border-[var(--wood-border)]
          overflow-hidden
        "
      >

        <BoosterverseDesktop />

      </section>


    </div>

  )

}


export default Dashboard
