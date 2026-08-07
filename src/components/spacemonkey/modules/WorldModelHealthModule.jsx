function WorldModelHealthModule({
  worldModel
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
        ◓ World Model Health
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
            worldModel?.status ||
            "AVAILABLE"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Awareness:
          </span>

          {" "}

          {
            worldModel?.awareness ||
            "CONNECTED"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Sources:
          </span>

          {" "}

          {
            worldModel?.sources ||
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
            worldModel?.description ||
            "World model health layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default WorldModelHealthModule
