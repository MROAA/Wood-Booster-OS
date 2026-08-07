function DecisionHealthModule({
  decision
}) {


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
        ⊗ Decision Health
      </h2>





      <div
        className="
          mt-5
          space-y-3
        "
      >

        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Status:
          </span>

          {" "}

          {
            decision?.status ||
            "AVAILABLE"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Evaluation:
          </span>

          {" "}

          {
            decision?.evaluation ||
            "CONNECTED"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Decisions:
          </span>

          {" "}

          {
            decision?.count ||
            0
          }

        </p>





        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >

          {
            decision?.description ||
            "Decision health layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default DecisionHealthModule
