import PulseCard from "./PulseCard"





function ActivityTimelineCard({
  activities,
}) {


  return (

    <PulseCard
      title="Activity Timeline"
    >


      <div
        className="
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

                <p
                  className="
                    text-[var(--wood-text)]
                  "
                >
                  {event.type}
                </p>



                <p
                  className="
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >
                  {event.module}
                  {" • "}
                  {event.status}
                </p>


              </div>

            )
          )
        }

      </div>


    </PulseCard>

  )

}



export default ActivityTimelineCard
