function WorkflowModule({
  workflow
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
        ↻ Workflow
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
            workflow?.status ||
            "READY"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Current Phase:
          </span>

          {" "}

          {
            workflow?.phase ||
            "Planning"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Progress:
          </span>

          {" "}

          {
            workflow?.progress ||
            "0"
          }
          %

        </p>





        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >

          {
            workflow?.description ||
            "Workflow intelligence layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default WorkflowModule
