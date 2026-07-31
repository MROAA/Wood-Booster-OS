function SpacemonkeyActivityStats({

  statistics = {}

}) {


  const cards = [

    {
      label:
        "Total Events",

      value:
        statistics.total || 0

    },


    {
      label:
        "Plans",

      value:
        statistics.plans || 0

    },


    {
      label:
        "Decisions",

      value:
        statistics.decisions || 0

    },


    {
      label:
        "Code Events",

      value:
        statistics.codeEvents || 0

    },


    {
      label:
        "Approvals",

      value:
        statistics.approvals || 0

    }

  ]







  return (

    <section

      className="
        rounded-2xl
        p-5
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >


      <h2

        className="
          text-lg
          font-semibold
        "

      >

        📊 Activity Statistics

      </h2>








      <div

        className="
          mt-4
          grid
          grid-cols-2
          gap-3
          md:grid-cols-5
        "

      >



        {
          cards.map(

            card => (

              <div

                key={
                  card.label
                }

                className="
                  rounded-xl
                  p-3
                "

                style={{

                  background:
                    "var(--wood-panel-dark)",


                  border:
                    "1px solid var(--wood-border)"

                }}

              >



                <p

                  className="
                    text-xs
                    uppercase
                  "

                  style={{

                    color:
                      "var(--wood-muted)"

                  }}

                >

                  {
                    card.label
                  }

                </p>






                <p

                  className="
                    mt-2
                    text-2xl
                    font-bold
                  "

                  style={{

                    color:
                      "var(--wood-accent)"

                  }}

                >

                  {
                    card.value
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



export default SpacemonkeyActivityStats
