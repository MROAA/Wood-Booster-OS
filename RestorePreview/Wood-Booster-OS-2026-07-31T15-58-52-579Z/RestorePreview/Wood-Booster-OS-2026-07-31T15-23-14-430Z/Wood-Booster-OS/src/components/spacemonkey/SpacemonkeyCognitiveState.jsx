function SpacemonkeyCognitiveState({

  runtimeActivity = null,

}) {


  function getState(){

    return (
      runtimeActivity?.state ||
      "idle"
    )

  }







  function getVisual(){

    const state =
      getState()



    switch(state){


      case "thinking":

        return {

          icon:
            "🔵",

          title:
            "Thinking",

          text:
            "Spacemonkey analysoi tietoa.",

          accent:
            true

        }





      case "decision":

        return {

          icon:
            "🧠",

          title:
            "Decision",

          text:
            "Spacemonkey tekee päätöstä.",

          accent:
            true

        }





      case "planning":

        return {

          icon:
            "📐",

          title:
            "Planning",

          text:
            "Spacemonkey suunnittelee aktiivista tehtävää.",

          accent:
            true

        }





      case "completed":

        return {

          icon:
            "✅",

          title:
            "Completed",

          text:
            "Tehtävä valmis.",

          accent:
            true

        }





      default:

        return {

          icon:
            "⚪",

          title:
            "Ready",

          text:
            "Spacemonkey odottaa tehtävää.",

          accent:
            false

        }


    }

  }








  const visual =
    getVisual()







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

        ⚡ Cognitive State

      </h2>








      <div

        className="
          mt-4
          flex
          items-center
          gap-4
        "

      >



        <div

          className="
            text-4xl
          "

        >

          {
            visual.icon
          }

        </div>






        <div>


          <p

            className="
              text-xl
              font-semibold
            "

            style={{

              color:
                visual.accent
                ? "var(--wood-accent)"
                : "var(--wood-text)"

            }}

          >

            {
              visual.title
            }

          </p>





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

            {
              visual.text
            }

          </p>



        </div>



      </div>









      {
        runtimeActivity?.activity?.lastPlan && (

          <div

            className="
              mt-4
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

              Current plan

            </p>





            <p

              className="
                mt-1
                text-sm
              "

            >

              {
                runtimeActivity.activity.lastPlan
              }

            </p>




          </div>

        )
      }





    </section>

  )

}





export default SpacemonkeyCognitiveState
