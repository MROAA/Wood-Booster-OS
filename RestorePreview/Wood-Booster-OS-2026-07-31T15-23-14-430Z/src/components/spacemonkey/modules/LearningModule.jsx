function LearningModule({
  learning
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
        🧠 Learning
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
            learning?.status ||
            "ACTIVE"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Learned Items:
          </span>

          {" "}

          {
            learning?.count ||
            0
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
            learning?.focus ||
            "Continuous improvement"
          }

        </p>





        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >

          {
            learning?.description ||
            "Learning intelligence layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default LearningModule
