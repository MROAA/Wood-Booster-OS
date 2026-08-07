function ReflectionCard({
  cognitive,
  decision
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
        ◑ Reflection
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
            Current Goal
          </p>


          <p
            className="
              mt-2
              text-sm
            "
          >
            {
              cognitive?.goal ||
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
            Thinking
          </p>


          <p
            className="
              mt-2
              text-sm
            "
          >
            {
              cognitive?.thinking ||
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
            Next Action
          </p>


          <p
            className="
              mt-2
              text-sm
            "
          >
            {
              cognitive?.nextAction ||
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
              Alignment
            </p>


            <p
              className="
                mt-2
                text-xl
                text-[var(--wood-accent)]
              "
            >
              {
                Math.round(
                  (decision?.alignment?.goal ?? 0) * 100
                )
              }%

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
              Risk
            </p>


            <p
              className="
                mt-2
                text-xl
              "
            >
              {
                Math.round(
                  (decision?.risk ?? 0) * 100
                )
              }%

            </p>


          </div>


        </div>


      </div>


    </section>

  )

}


export default ReflectionCard
