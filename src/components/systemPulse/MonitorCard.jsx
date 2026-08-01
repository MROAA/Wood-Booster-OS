import PulseCard from "./PulseCard"





function MonitorCard({
  connection,
  lastUpdate,
}) {


  return (

    <PulseCard
      title="Pulse Monitor"
    >


      <div
        className="
          space-y-3
          text-sm
          text-[var(--wood-muted)]
        "
      >

        <p>
          Connection:
          {" "}
          {
            connection
          }
        </p>



        <p>
          Last update:
          {" "}
          {
            lastUpdate
              ?
              lastUpdate.toLocaleTimeString()
              :
              "-"
          }
        </p>


      </div>


    </PulseCard>

  )

}



export default MonitorCard
