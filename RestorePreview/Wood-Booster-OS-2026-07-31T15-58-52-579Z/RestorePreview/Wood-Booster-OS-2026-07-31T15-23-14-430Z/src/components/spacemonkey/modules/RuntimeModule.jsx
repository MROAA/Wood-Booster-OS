function RuntimeModule({
  runtime
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
        ⚙ Runtime
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
            runtime?.status ||
            "ONLINE"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Platform:
          </span>

          {" "}

          {
            runtime?.platform ||
            "Linux"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Node:
          </span>

          {" "}

          {
            runtime?.nodeVersion ||
            "-"
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
            runtime?.environment ||
            "Wood-Booster OS"
          }

        </p>


      </div>


    </section>

  )

}


export default RuntimeModule
