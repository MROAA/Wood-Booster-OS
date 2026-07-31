function ActivityFeed({
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
        🐒 Spacemonkey Activity
      </h2>





      <div
        className="
          mt-6
          space-y-4
        "
      >


        {
          activities.map(
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
                    text-[var(--wood-text)]
                  "
                >

                  ✓ {event.message}

                </p>



                <p
                  className="
                    mt-1
                    text-xs
                    text-[var(--wood-muted)]
                  "
                >

                  {event.module}

                  {" • "}

                  {event.status}

                </p>



                <p
                  className="
                    mt-1
                    text-xs
                    text-[var(--wood-muted)]
                  "
                >

                  {
                    new Date(
                      event.createdAt
                    ).toLocaleString()
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
              No activity yet

            </p>

          )
        }


      </div>


    </section>

  )

}


export default ActivityFeed
