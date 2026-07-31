function ExecutionModule({
  execution
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
        ⚙ Execution
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
            execution?.status ||
            "READY"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Last Action:
          </span>

          {" "}

          {
            execution?.action ||
            "No action"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Result:
          </span>

          {" "}

          {
            execution?.result ||
            "Waiting"
          }

        </p>





        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >

          {
            execution?.description ||
            "Execution intelligence layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default ExecutionModule
