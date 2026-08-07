import {
  useState,
} from "react"


import SecurityGuard from "./SecurityGuard"


import {
  runSpacemonkeyCommand,
} from "../../services/spacemonkeyApi"





const actions = [

  {
    id: "restart-core",

    label: "Restart Core",

    description:
      "Käynnistä Spacemonkey Core uudelleen",

    level: "warning",
  },


  {
    id: "purge-logs",

    label: "Purge Logs",

    description:
      "Tyhjennä järjestelmälokit",

    level: "danger",
  },


  {
    id: "emergency-stop",

    label: "Emergency Stop",

    description:
      "Pysäytä järjestelmän kriittiset toiminnot",

    level: "critical",
  },

]







function QuickActions(){


  const [loading,setLoading] =
    useState(false)



  const [message,setMessage] =
    useState("")







  async function executeAction(action){


    setMessage("")



    const approved =
      SecurityGuard.validateCommand(
        action.id
      )



    if(!approved){


      setMessage(
        "✗ SecurityGuard esti komennon"
      )


      return

    }



    try{


      setLoading(true)



      const result =
        await runSpacemonkeyCommand(
          action.id
        )



      setMessage(
        result.message ||
        "Command executed"
      )


    }


    catch(error){


      setMessage(
        error.message
      )


    }


    finally{


      setLoading(false)


    }


  }









  return (

    <section

      className="
        rounded-3xl
        border
        border-neutral-800
        bg-neutral-950
        p-6
      "

    >



      <p

        className="
          text-xs
          uppercase
          tracking-[0.3em]
          text-orange-400
        "

      >

        Monkey Controls

      </p>





      <h2

        className="
          mt-2
          text-xl
          font-bold
          text-white
        "

      >

        Critical Actions

      </h2>







      <div

        className="
          mt-5
          space-y-4
        "

      >



        {
          actions.map(
            (action)=>(


              <button


                key={
                  action.id
                }


                type="button"


                disabled={
                  loading
                }


                onClick={
                  () =>
                    executeAction(
                      action
                    )
                }



                className={`

                  w-full

                  rounded-2xl

                  border

                  p-5

                  text-left

                  transition

                  disabled:opacity-50


                  ${
                    action.level === "critical"

                    ?

                    "border-red-500/40 bg-red-500/10 hover:bg-red-500/20"

                    :

                    action.level === "danger"

                    ?

                    "border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20"

                    :

                    "border-green-500/40 bg-green-500/10 hover:bg-green-500/20"

                  }

                `}


              >



                <div

                  className="
                    font-bold
                    text-white
                  "

                >

                  {action.label}

                </div>





                <div

                  className="
                    mt-2
                    text-sm
                    text-neutral-400
                  "

                >

                  {action.description}

                </div>



              </button>


            )

          )
        }



      </div>







      {
        message && (

          <div

            className="
              mt-5
              rounded-xl
              border
              border-neutral-800
              bg-neutral-900
              p-4
              text-sm
              text-neutral-300
            "

          >

            {message}

          </div>


        )
      }





    </section>

  )


}





export default QuickActions