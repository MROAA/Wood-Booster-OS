function SpacemonkeyUnifiedRuntimeCard({

  runtime = {}

}) {


  return (

    <section

      className="
        rounded-2xl
        p-5
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >


      <h2

        className="
          text-lg
          font-semibold
        "

      >

        🧠 Unified Runtime

      </h2>





      <div

        className="
          mt-4
          space-y-3
          text-sm
        "

      >





        <RuntimeRow

          label="State"

          value={
            runtime.state ||
            "idle"
          }

          accent

        />







        <RuntimeRow

          label="Current task"

          value={
            runtime.task ||
            "Ei aktiivista tehtävää"
          }

        />







        <RuntimeRow

          label="Last action"

          value={
            runtime.action ||
            "-"
          }

        />







        {
          runtime.decision && (

            <RuntimeRow

              label="Decision"

              value={
                runtime.decision.name
              }

            />

          )
        }





      </div>





    </section>

  )

}








function RuntimeRow({

  label,

  value,

  accent = false,

}){


  return (

    <div

      className="
        flex
        justify-between
        gap-4
      "

    >



      <span

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        {label}:

      </span>





      <span

        className="
          text-right
        "

        style={{

          color:
            accent
            ? "var(--wood-accent)"
            : "var(--wood-text)"

        }}

      >

        {value}

      </span>





    </div>

  )

}





export default SpacemonkeyUnifiedRuntimeCard
