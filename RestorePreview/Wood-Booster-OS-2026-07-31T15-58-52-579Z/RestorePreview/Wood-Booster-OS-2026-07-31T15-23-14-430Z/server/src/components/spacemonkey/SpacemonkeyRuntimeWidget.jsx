import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
} from "../../api/client"



function SpacemonkeyRuntimeWidget(){


  const [
    runtime,
    setRuntime,
  ] = useState(null)



  const [
    message,
    setMessage,
  ] = useState("starting")





  useEffect(()=>{


    async function loadRuntime(){


      try{


        setMessage(
          "connecting..."
        )


        const data =

          await apiGet(
            "/spacemonkey/runtime"
          )



        console.log(
          "SPACEMONKEY RUNTIME:",
          data
        )



        setRuntime(
          data
        )



        setMessage(
          "connected"
        )


      }


      catch(error){


        console.error(
          "SPACEMONKEY RUNTIME ERROR:",
          error
        )


        setMessage(
          error.message
        )


      }


    }



    loadRuntime()


  },[])







  return (

    <section

      className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
        text-white
      "

    >


      <h2 className="text-lg font-bold">

        🧠 Spacemonkey Runtime

      </h2>




      <p className="mt-3">

        Status:

        <span className="ml-2 text-amber-400">

          {message}

        </span>

      </p>






      {
        runtime && (

          <div
            className="
              mt-4
              space-y-2
            "
          >


            <div>

              System:

              <span className="ml-2">

                {runtime.system}

              </span>

            </div>



            <div>

              State:

              <span className="ml-2">

                {runtime.state}

              </span>

            </div>



            <div>

              Last Action:

              <span className="ml-2">

                {
                  runtime.activity?.lastAction
                  ||
                  "-"
                }

              </span>

            </div>



            <div>

              Last Plan:

              <span className="ml-2">

                {
                  runtime.activity?.lastPlan
                  ||
                  "-"
                }

              </span>

            </div>



          </div>

        )
      }





    </section>

  )

}



export default SpacemonkeyRuntimeWidget
