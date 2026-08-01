import PulseCard from "./PulseCard"





function MonitorCard({
  connection,
  lastUpdate,
  pulse,
  healthChange,
}) {


  const healthScore =
    pulse?.healthScore



  const score =
    healthScore?.score
    ??
    0



  const status =
    healthScore?.status
    ||
    "unknown"





  const changeText =
    healthChange
      ?
      `${healthChange.from} → ${healthChange.to} (${healthChange.difference > 0 ? "+" : ""}${healthChange.difference})`
      :
      "No changes"





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



        <p>
          Health:

          {" "}

          <span
            className="
              text-[var(--wood-text)]
            "
          >
            {
              score
            }
            /100
          </span>

        </p>



        <p>
          Status:

          {" "}

          <span
            className="
              text-[var(--wood-text)]
            "
          >
            {
              status
            }
          </span>

        </p>



        <p>
          Change:

          {" "}

          <span
            className="
              text-[var(--wood-text)]
            "
          >
            {
              changeText
            }
          </span>

        </p>


      </div>


    </PulseCard>

  )

}



export default MonitorCard
