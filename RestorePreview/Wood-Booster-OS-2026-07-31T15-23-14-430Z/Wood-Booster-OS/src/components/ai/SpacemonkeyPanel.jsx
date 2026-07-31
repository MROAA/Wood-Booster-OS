import {
  useEffect,
  useState,
} from "react"


import Card from "../ui/Card"

import StatusBadge from "../ui/StatusBadge"

import SpacemonkeyLogo from "../brand/SpacemonkeyLogo"





const API_URL =
  "http://localhost:3001/api"






function SpacemonkeyPanel(){


  const [
    core,
    setCore,
  ] = useState(null)






  useEffect(()=>{


    async function loadCore(){


      try{


        const response =
          await fetch(
            `${API_URL}/spacemonkey/core`
          )


        const data =
          await response.json()



        if(data.success){

          setCore(
            data.data
          )

        }


      }


      catch(error){

        console.error(
          "Spacemonkey core error",
          error
        )

      }


    }



    loadCore()


  },[])







  return (

    <Card

      className="
        h-full
        flex
        flex-col
        items-center
        justify-center
      "

    >



      <div

        className="
          flex
          flex-col
          items-center
          w-full
        "

      >




        <SpacemonkeyLogo />





        <h2

          className="
            mt-5
            text-xl
            font-semibold
            spacemonkey-title
          "

        >

          Spacemonkey

        </h2>





        <p

          className="
            mt-1
            text-xs
            uppercase
            tracking-widest
          "

          style={{

            color:
              "var(--wood-muted)"

          }}

        >

          Enterprise AI Operator

        </p>







        <section

          className="
            mt-8
            w-full
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



          <p

            className="
              mb-3
              text-xs
              uppercase
              tracking-widest
            "

            style={{

              color:
                "var(--wood-muted)"

            }}

          >

            Kernel Status

          </p>





          <Status

            name="Core"

            value="READY"

          />



          <Status

            name="AI Brain"

            value={
              core?.status === "active"
              ?
              "READY"
              :
              "READY"
            }

          />



          <Status

            name="Security"

            value="ACTIVE"

          />



        </section>


      </div>


    </Card>

  )

}








function Status({

  name,

  value,

}){


return (

<div

className="
flex
items-center
justify-between
py-2
"

>


<span

className="
text-sm
"

style={{

color:
"var(--wood-muted)"

}}

>

{name}

</span>



<StatusBadge

status={value}

/>


</div>

)

}




export default SpacemonkeyPanel
