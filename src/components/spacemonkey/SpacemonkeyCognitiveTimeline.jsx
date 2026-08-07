function SpacemonkeyCognitiveTimeline({
  activity = [],
}) {



  function getIcon(type){

    switch(type){

      case "PLAN_CREATED":
        return "▤"


      case "DECISION_CREATED":
        return "⬢"


      case "code_generation_completed":
        return "⊞"


      case "write_completed":
        return "▤"


      case "approval_requested":
        return "⊟"


      case "release_gate_evaluated":
        return "◒"


      case "code_quality_evaluated":
        return "◌"


      case "code_execution_simulated":
        return "⚙"


      default:
        return "◉"

    }

  }







  function getImportanceStyle(

    importance

  ){

    switch(importance){


      case "high":

        return {

          icon:
            "◆",

          accent:
            true,

          label:
            "HIGH"

        }





      case "medium":

        return {

          icon:
            "◒",

          accent:
            true,

          label:
            "MEDIUM"

        }





      default:

        return {

          icon:
            "○",

          accent:
            false,

          label:
            "LOW"

        }


    }

  }








  function formatDate(date){

    if(!date){

      return ""

    }


    return new Date(date)
      .toLocaleString("fi-FI")

  }








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

        ⬢ Cognitive Timeline

      </h2>






      <p

        className="
          mt-1
          text-sm
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        Spacemonkeyn kehityksen ja ajattelun tapahtumavirta

      </p>







      <div

        className="
          mt-5
          space-y-3
        "

      >



        {
          activity.length === 0 && (

            <p

              className="
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
        }









        {
          activity.map(

            item => {


              const priority =
                getImportanceStyle(
                  item.importance
                )





              return (

                <article

                  key={
                    item.id ||
                    item.createdAt ||
                    item.type
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
                      items-start
                      justify-between
                      gap-4
                    "

                  >





                    <div

                      className="
                        flex
                        gap-3
                      "

                    >



                      <div

                        className="
                          text-2xl
                        "

                      >

                        {
                          getIcon(
                            item.type
                          )
                        }

                      </div>







                      <div>


                        <h3

                          className="
                            text-sm
                            font-semibold
                          "

                        >

                          {
                            item.title ||
                            item.type
                          }

                        </h3>







                        <p

                          className="
                            mt-1
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



                      </div>



                    </div>









                    <div

                      className="
                        text-xs
                        font-bold
                      "

                      style={{

                        color:
                          priority.accent
                          ? "var(--wood-accent)"
                          : "var(--wood-muted)"

                      }}

                    >

                      <p>

                        {
                          priority.icon
                        }

                        {" "}

                        {
                          priority.label
                        }

                      </p>


                    </div>





                  </div>









                  <div

                    className="
                      mt-3
                      flex
                      justify-between
                      text-xs
                    "

                    style={{

                      color:
                        "var(--wood-muted)"

                    }}

                  >


                    <span>

                      {
                        item.module
                      }

                    </span>





                    <span>

                      {
                        formatDate(
                          item.createdAt
                        )
                      }

                    </span>



                  </div>






                </article>

              )


            }

          )

        }




      </div>





    </section>

  )

}



export default SpacemonkeyCognitiveTimeline
