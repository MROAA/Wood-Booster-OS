function ActivityTimelineCard({
  activities,
}) {


  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2>
        Activity Timeline
      </h2>



      <div
        className="
          mt-5
          space-y-4
        "
      >

        {
          activities?.map(
            event => (

              <div
                key={event.id}
                className="
                  border-l
                  border-[var(--wood-accent)]
                  pl-4
                "
              >

                <p>
                  {event.type}
                </p>


                <p>
                  {event.module}
                  {" • "}
                  {event.status}
                </p>


              </div>

            )
          )
        }

      </div>


    </section>

  )

}



export default ActivityTimelineCard
