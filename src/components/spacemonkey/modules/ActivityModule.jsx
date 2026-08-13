function ActivityModule({
  activities = []
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
        ⬡ Activity
      </h2>





      <div
        className="
          mt-5
          space-y-4
        "
      >

        {
          activities
            .slice(0, 10)
            .map(
              event => (

                <div
                  key={event.id}
                  className="
                    border-l
                    border-[var(--wood-accent)]
                    pl-4
                  "
                >

                  <p
                    className="
                      text-sm
                    "
                  >
                    {event.message ||
                      event.type ||
                      "System event"
                    }
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-[var(--wood-muted)]
                    "
                  >

                    {
                      event.module ||
                      "Spacemonkey"
                    }

                    {" • "}

                    {
                      event.status ||
                      "active"
                    }

                  </p>


                </div>

              )
            )
        }





        {
          activities.length === 0 && (

            <p
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >
              No activity available

            </p>

          )
        }


      </div>


    </section>

  )

}


export default ActivityModule
