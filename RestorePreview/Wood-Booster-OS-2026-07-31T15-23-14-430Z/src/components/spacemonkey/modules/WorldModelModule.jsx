function WorldModelModule({
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
        🌍 World Model
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
            "CONNECTED"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Environment:
          </span>

          {" "}

          {
            worldModel?.environment ||
            "Wood-Booster OS"
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
            "ACTIVE"
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
            "World model layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default WorldModelModule
