function SafetyCard({
  safety
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
        ▩ Safety
      </h2>




      <div
        className="
          mt-6
          grid
          grid-cols-3
          gap-4
        "
      >

        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Status
          </p>

          <p
            className="
              mt-2
              text-sm
            "
          >
            {
              safety?.status ||
              "-"
            }
          </p>

        </div>



        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Snapshots
          </p>

          <p
            className="
              mt-2
              text-sm
            "
          >
            {
              safety?.snapshots ??
              0
            }
          </p>

        </div>



        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Recovery
          </p>

          <p
            className="
              mt-2
              text-sm
            "
          >
            {
              safety?.recovery?.available
              ?
              "Available"
              :
              "Unavailable"
            }

            {" "}
            ({
              safety?.recovery?.pending ??
              0
            }
            {" "}
            pending)
          </p>

        </div>


      </div>


    </section>

  )

}


export default SafetyCard
