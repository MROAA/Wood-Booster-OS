function DecisionCard({
  decision
}) {


  function Metric({
    name,
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
            {name}
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
            overflow-hidden
            bg-[var(--wood-panel)]
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
        ⊗ Decision Quality
      </h2>





      <div
        className="
          mt-6
          space-y-5
        "
      >

        <Metric
          name="Truth Score"
          value={
            decision?.alignment?.truth
          }
        />



        <Metric
          name="Goal Alignment"
          value={
            decision?.alignment?.goal
          }
        />



        <Metric
          name="Value Alignment"
          value={
            decision?.alignment?.value
          }
        />



        <Metric
          name="Risk"
          value={
            decision?.risk
          }
        />


      </div>


    </section>

  )

}


export default DecisionCard
