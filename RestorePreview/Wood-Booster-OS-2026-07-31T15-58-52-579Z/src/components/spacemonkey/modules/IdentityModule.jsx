function IdentityModule({
  identity
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
        🐒 Identity
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
            Name:
          </span>

          {" "}

          {
            identity?.name ||
            "Spacemonkey"
          }

        </p>



        <p>
          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Role:
          </span>

          {" "}

          {
            identity?.role ||
            "Wood-Booster OS Operator"
          }

        </p>



        <p>
          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Creator:
          </span>

          {" "}

          {
            identity?.creator ||
            "-"
          }

        </p>



        <p>
          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Purpose:
          </span>

          {" "}

          {
            identity?.purpose ||
            "-"
          }

        </p>



      </div>


    </section>

  )

}


export default IdentityModule
