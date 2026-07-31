function ActivityHealthModule({
  activity
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
        🐒 Activity Health
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
            activity?.status ||
            "ACTIVE"
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Events:
          </span>

          {" "}

          {
            activity?.events ||
            0
          }

        </p>





        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Stream:
          </span>

          {" "}

          {
            activity?.stream ||
            "CONNECTED"
          }

        </p>





        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >

          {
            activity?.description ||
            "Activity health layer connected"
          }

        </p>


      </div>


    </section>

  )

}


export default ActivityHealthModule
