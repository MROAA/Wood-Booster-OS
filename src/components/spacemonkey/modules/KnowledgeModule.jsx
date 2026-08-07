function KnowledgeModule({
  knowledge
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
        ◌ Knowledge
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
            knowledge?.status ||
            "CONNECTED"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Documents:
          </span>

          {" "}

          {
            knowledge?.documents ??
            0
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
            knowledge?.sources ??
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
            knowledge?.description ||
            "Knowledge layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default KnowledgeModule
