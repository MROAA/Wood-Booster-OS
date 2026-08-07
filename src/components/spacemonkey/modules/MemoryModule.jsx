function MemoryModule({
  memory
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
        ◈ Memory
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
            memory?.status ||
            "CONNECTED"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Saved:
          </span>

          {" "}

          {
            memory?.saved ??
            0
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Memories:
          </span>

          {" "}

          {
            memory?.count ??
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
            memory?.description ||
            "Memory intelligence layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default MemoryModule
