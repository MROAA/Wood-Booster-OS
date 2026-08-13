function SecurityModule({
  security
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
        ⊟ Security
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
            security?.status ||
            "PROTECTED"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Sandbox:
          </span>

          {" "}

          {
            security?.sandbox ||
            "ENABLED"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Protection Level:
          </span>

          {" "}

          {
            security?.level ||
            "HIGH"
          }

        </p>





        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >

          {
            security?.description ||
            "Security layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default SecurityModule
