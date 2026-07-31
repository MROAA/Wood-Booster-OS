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

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2>
        Git Sync History
      </h2>



      <p
        className="
          mt-3
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

                <p>
                  {
                    event.type
                  }
                </p>


                <p
                  className="
                    text-sm
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


    </section>

  )

}



export default GitHistoryCard
