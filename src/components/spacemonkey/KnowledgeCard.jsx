function KnowledgeCard({
  knowledge
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
        ◌ Knowledge
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
            Engine Status
          </p>


          <p
            className="
              mt-2
              text-xl
              text-[var(--wood-accent)]
            "
          >
            {
              knowledge?.status ||
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
            Sources
          </p>


          <p
            className="
              mt-2
              text-2xl
            "
          >
            {
              knowledge?.sources ??
              0
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
            Domains
          </p>



          <div
            className="
              mt-3
              space-y-2
            "
          >

            {
              (
                knowledge?.domains ||
                []
              ).map(
                domain => (

                  <p
                    key={domain}
                    className="
                      text-sm
                      text-[var(--wood-text)]
                    "
                  >
                    ◌ {domain}

                  </p>

                )
              )
            }



            {
              !knowledge?.domains?.length && (

                <p
                  className="
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >
                  No domains loaded

                </p>

              )
            }


          </div>


        </div>


      </div>


    </section>

  )

}


export default KnowledgeCard
