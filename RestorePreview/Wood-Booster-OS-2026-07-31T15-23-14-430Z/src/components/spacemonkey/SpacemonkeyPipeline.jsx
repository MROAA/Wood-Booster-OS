const stageMap = {

  decision: {
    name:
      "Päätös",

    icon:
      "🧠",
  },


  planning: {
    name:
      "Suunnittelu",

    icon:
      "📐",
  },


  execution: {
    name:
      "Toteutus",

    icon:
      "⚙️",
  },


  completed: {
    name:
      "Valmis",

    icon:
      "✅",
  },


  active: {
    name:
      "Aktiivinen",

    icon:
      "🔄",
  },

}







function SpacemonkeyPipeline({

  activity = [],

}) {



  return (

    <section

      className="
        rounded-2xl
        p-4
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >





      <h3

        className="
          text-lg
          font-semibold
        "

      >

        🔄 Spacemonkey tapahtumat

      </h3>









      {
        activity.length === 0

        ?

        (

          <p

            className="
              mt-4
              text-sm
            "

            style={{

              color:
                "var(--wood-muted)"

            }}

          >

            Ei tapahtumia vielä.

          </p>

        )


        :


        (

          <div

            className="
              mt-4
              space-y-3
            "

          >

            {
              activity.map(

                item => {


                  const stage =

                    stageMap[
                      item.status
                    ]

                    ||

                    {

                      name:
                        item.status,

                      icon:
                        "📌"

                    }






                  return (

                    <div

                      key={
                        item.id ||
                        item.createdAt
                      }


                      className="
                        rounded-xl
                        p-4
                      "


                      style={{

                        background:
                          "var(--wood-panel-dark)",


                        border:
                          "1px solid var(--wood-border)"

                      }}

                    >






                      <div

                        className="
                          flex
                          items-center
                          justify-between
                          gap-3
                        "

                      >





                        <span

                          className="
                            font-semibold
                          "

                        >

                          {stage.icon}


                          <span

                            className="
                              ml-2
                            "

                          >

                            {stage.name}

                          </span>


                        </span>







                        <span

                          className="
                            text-xs
                            uppercase
                          "

                          style={{

                            color:
                              "var(--wood-accent)"

                          }}

                        >

                          {
                            item.status
                          }

                        </span>





                      </div>








                      <p

                        className="
                          mt-3
                          text-sm
                        "

                        style={{

                          color:
                            "var(--wood-text)"

                        }}

                      >

                        {
                          item.message
                        }

                      </p>








                      {
                        item.createdAt &&


                        <p

                          className="
                            mt-2
                            text-xs
                          "

                          style={{

                            color:
                              "var(--wood-muted)"

                          }}

                        >

                          {
                            new Date(
                              item.createdAt
                            ).toLocaleString(
                              "fi-FI"
                            )
                          }

                        </p>

                      }




                    </div>

                  )

                }

              )

            }


          </div>

        )

      }





    </section>

  )

}





export default SpacemonkeyPipeline
