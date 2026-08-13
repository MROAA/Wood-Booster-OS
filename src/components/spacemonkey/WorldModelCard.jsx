function WorldModelCard({
  worldModel
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
        ◓ World Model
      </h2>





      <div
        className="
          mt-6
          space-y-5
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
            Engine
          </p>


          <p
            className="
              mt-2
              text-lg
            "
          >
            {
              worldModel?.engine ||
              "Checking..."
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
            Version
          </p>


          <p
            className="
              mt-2
              text-lg
            "
          >
            {
              worldModel?.version ||
              "-"
            }

          </p>


        </div>





        <div
          className="
            grid
            grid-cols-2
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
              Entities
            </p>


            <p
              className="
                mt-2
                text-3xl
                text-[var(--wood-accent)]
              "
            >
              {
                worldModel?.entities ?? 0
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
              Relations
            </p>


            <p
              className="
                mt-2
                text-3xl
                text-[var(--wood-accent)]
              "
            >
              {
                worldModel?.relations ?? 0
              }

            </p>


          </div>


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
            Persistence
          </p>


          <p
            className="
              mt-2
              text-sm
            "
          >
            {
              worldModel?.persistent
              ?
              "ACTIVE"
              :
              "CHECKING"
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
            Last Updated
          </p>


          <p
            className="
              mt-2
              text-sm
            "
          >

            {
              worldModel?.lastUpdated
              ?
              new Date(
                worldModel.lastUpdated
              ).toLocaleString()
              :
              "-"
            }

          </p>


        </div>


      </div>


    </section>

  )

}


export default WorldModelCard
