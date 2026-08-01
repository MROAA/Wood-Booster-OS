import PulseCard from "./PulseCard"





function GitHistoryCard({
  pulse,
}) {


  const history =
    pulse?.gitHistory





  const events =
    history?.events
    ||
    []





  return (

    <PulseCard
      title="Git Sync History"
    >


      <p
        className="
          text-sm
          text-[var(--wood-muted)]
        "
      >

        Total events:

        {" "}

        {
          history?.total
          ??
          0
        }

      </p>





      <div
        className="
          mt-5
          space-y-4
        "
      >

        {
          events.map(
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
                  {
                    event.type
                  }
                </p>



                <p
                  className="
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >

                  Status:

                  {" "}

                  {
                    event.status
                  }

                </p>



                <p
                  className="
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >

                  Commit:

                  {" "}

                  {
                    event.commit
                  }

                </p>



                <p
                  className="
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >

                  Files:

                  {" "}

                  {
                    event.changedFiles
                  }

                </p>



                <p
                  className="
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


      </div>


    </PulseCard>

  )

}



export default GitHistoryCard
