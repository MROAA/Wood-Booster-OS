function GoalModule({
  goal
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
        ◉ Goal
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
            Current:
          </span>

          {" "}

          {
            goal?.current ||
            "Building Wood-Booster OS"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Direction:
          </span>

          {" "}

          {
            goal?.direction ||
            "Continuous development"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Priority:
          </span>

          {" "}

          {
            goal?.priority ||
            "High"
          }

        </p>





        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >

          {
            goal?.description ||
            "Goal intelligence layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default GoalModule
