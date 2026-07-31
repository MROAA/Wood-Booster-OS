function SpacemonkeyCognitiveStateCard({

  cognitiveState = {}

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

        🧠 Cognitive State

      </h2>






      <div

        className="
          mt-4
          space-y-3
          text-sm
        "

      >





        <StateRow

          label="State"

          value={
            cognitiveState.state ||
            "idle"
          }

          accent

        />






        <StateRow

          label="Thinking"

          value={
            cognitiveState.thinking ||
            "-"
          }

        />







        <StateRow

          label="Goal"

          value={
            cognitiveState.goal ||
            "-"
          }

        />







        <StateRow

          label="Next action"

          value={
            cognitiveState.nextAction ||
            "-"
          }

        />





      </div>





    </section>

  )

}








function StateRow({

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





export default SpacemonkeyCognitiveStateCard
