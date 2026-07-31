function DecisionModule({
  decision
}) {


  function Metric({
    label,
    value
  }) {


    const percent =
      Math.round(
        (value ?? 0) * 100
      )


    return (

      <div
        className="
          space-y-2
        "
      >

        <div
          className="
            flex
            justify-between
            text-sm
          "
        >

          <span>
            {label}
          </span>


          <span
            className="
              text-[var(--wood-accent)]
            "
          >
            {percent}%
          </span>


        </div>


        <div
          className="
            h-2
            rounded-full
            bg-[var(--wood-panel)]
            overflow-hidden
          "
        >

          <div
            className="
              h-full
              bg-[var(--wood-accent)]
            "
            style={{
              width:`${percent}%`
            }}
          />

        </div>


      </div>

    )

  }





  return (

    <section
      className="
        card
        p-6
        wood-hover
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
        ⚖ Decision
      </h2>





      <div
        className="
          mt-5
          space-y-5
        "
      >

        <Metric
          label="Truth Score"
          value={
            decision?.truthScore
          }
        />


        <Metric
          label="Goal Alignment"
          value={
            decision?.goalAlignment
          }
        />


        <Metric
          label="Value Alignment"
          value={
            decision?.valueAlignment
          }
        />


        <Metric
          label="Risk"
          value={
            decision?.risk
          }
        />


      </div>


    </section>

  )

}


export default DecisionModule
