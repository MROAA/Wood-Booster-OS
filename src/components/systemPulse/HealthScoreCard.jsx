import PulseCard from "./PulseCard"





function HealthScoreCard({
  pulse,
}) {


  const healthScore =
    pulse?.healthScore



  const score =
    healthScore?.score
    ??
    0



  const status =
    healthScore?.status
    ||
    "unknown"



  const details =
    healthScore?.details
    ||
    []





  return (

    <PulseCard
      title="System Health"
    >


      <div
        className="
          space-y-5
        "
      >

        <div>

          <div
            className="
              flex
              justify-between
              text-sm
              text-[var(--wood-muted)]
            "
          >

            <span>
              Score
            </span>


            <span
              className="
                text-[var(--wood-text)]
              "
            >
              {
                score
              }
              /100
            </span>

          </div>



          <div
            className="
              mt-2
              h-2
              rounded-full
              bg-[var(--wood-card)]
              overflow-hidden
            "
          >

            <div
              className="
                h-full
                rounded-full
                bg-[var(--wood-accent)]
              "
              style={{
                width: `${score}%`,
              }}
            />

          </div>

        </div>





        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >

          Status:

          {" "}

          <span
            className="
              text-[var(--wood-text)]
            "
          >
            {
              status
            }
          </span>

        </p>





        <div
          className="
            space-y-3
          "
        >

          <h3
            className="
              text-sm
              text-[var(--wood-text)]
            "
          >
            Checks
          </h3>



          {
            details.map(
              item => (

                <div
                  key={item.name}
                  className="
                    flex
                    justify-between
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >

                  <span>
                    {
                      item.status === "healthy"
                        ?
                        "✓"
                        :
                        "⚠"
                    }

                    {" "}

                    {
                      item.name
                    }
                  </span>



                  <span>
                    {
                      item.score
                    }
                  </span>

                </div>

              )
            )
          }


        </div>


      </div>


    </PulseCard>

  )

}



export default HealthScoreCard
