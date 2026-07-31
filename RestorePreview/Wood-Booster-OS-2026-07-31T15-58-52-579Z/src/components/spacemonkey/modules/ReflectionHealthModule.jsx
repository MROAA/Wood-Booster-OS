function ReflectionHealthModule({
  reflection
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
        🪞 Reflection Health
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
            reflection?.status ||
            "AVAILABLE"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Analysis:
          </span>

          {" "}

          {
            reflection?.analysis ||
            "CONNECTED"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Insights:
          </span>

          {" "}

          {
            reflection?.insights ||
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
            reflection?.description ||
            "Reflection health layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default ReflectionHealthModule
