import AIBrainTabs from "../components/ai/AIBrainTabs"
import SpacemonkeyLogo from "../components/brand/SpacemonkeyLogo"



function AIBrain() {


  return (

    <div
      className="
        space-y-8
      "
    >



      <section
        className="
          panel
        "
      >


        <div
          className="
            flex
            items-center
            gap-5
          "
        >


          <div
            className="
              h-20
              w-20
            "
          >

            <SpacemonkeyLogo />

          </div>




          <div>

            <h1
              className="
                page-title
              "
            >

              Spacemonkey

            </h1>


            <p
              className="
                page-description
              "
            >

              Wood-Booster OS:n operaattori ja keskustelukumppani.

            </p>


          </div>


        </div>


      </section>





      <section>

        <AIBrainTabs />

      </section>



    </div>

  )

}


export default AIBrain
