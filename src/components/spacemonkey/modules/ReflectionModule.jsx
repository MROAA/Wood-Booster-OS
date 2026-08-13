function ReflectionModule({
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
        ◑ Reflection
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
            "ACTIVE"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            State:
          </span>

          {" "}

          {
            reflection?.state ||
            "OBSERVING"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Focus:
          </span>

          {" "}

          {
            reflection?.focus ||
            "Learning and improvement"
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
            "Reflection layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default ReflectionModule
