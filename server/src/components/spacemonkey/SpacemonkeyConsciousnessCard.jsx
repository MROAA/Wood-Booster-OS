import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
} from "../../api/client"





function SpacemonkeyConsciousnessCard(){


  const [
    consciousness,
    setConsciousness
  ] = useState(null)



  const [
    loading,
    setLoading
  ] = useState(true)





  useEffect(()=>{


    async function loadConsciousness(){


      try{


        const response =
          await apiGet(
            "/spacemonkey/consciousness"
          )


        setConsciousness(
          response.data
        )


      }


      catch(error){


        console.error(
          "Spacemonkey consciousness error",
          error
        )


      }


      finally{


        setLoading(false)


      }


    }



    loadConsciousness()



    const interval =
      setInterval(
        loadConsciousness,
        5000
      )



    return ()=>{


      clearInterval(
        interval
      )


    }


  },[])







  if(loading){


    return (

      <section
        className="
          rounded-2xl
          border
          border-neutral-800
          bg-neutral-900
          p-5
          text-neutral-400
        "
      >

        Loading consciousness...

      </section>

    )

  }







  if(!consciousness){


    return (

      <section
        className="
          rounded-2xl
          border
          border-red-900
          bg-neutral-900
          p-5
          text-red-400
        "
      >

        Consciousness offline

      </section>

    )

  }







  return (

    <section
      className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      "
    >


      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <div>

          <h2
            className="
              text-lg
              font-semibold
              text-white
            "
          >
            🧠 Spacemonkey Consciousness
          </h2>


          <p
            className="
              mt-1
              text-sm
              text-neutral-400
            "
          >
            Current intelligence state
          </p>

        </div>


        <div
          className="
            rounded-full
            bg-green-900
            px-3
            py-1
            text-xs
            text-green-300
          "
        >
          ACTIVE
        </div>

      </div>







      <div
        className="
          mt-5
          space-y-3
        "
      >



        <div
          className="
            rounded-xl
            bg-neutral-800
            p-4
          "
        >

          <p
            className="
              text-xs
              text-neutral-400
            "
          >
            🧠 State
          </p>


          <p
            className="
              mt-1
              text-xl
              font-semibold
              text-white
            "
          >
            {consciousness.state}
          </p>

        </div>






        <div
          className="
            rounded-xl
            bg-neutral-800
            p-4
          "
        >

          <p
            className="
              text-xs
              text-neutral-400
            "
          >
            🎯 Current Goal
          </p>


          <p
            className="
              mt-1
              text-white
            "
          >
            {consciousness.goal || "Ei aktiivista tavoitetta"}
          </p>

        </div>






        <div
          className="
            rounded-xl
            bg-neutral-800
            p-4
          "
        >

          <p
            className="
              text-xs
              text-neutral-400
            "
          >
            ➡️ Next Action
          </p>


          <p
            className="
              mt-1
              text-white
            "
          >
            {consciousness.nextAction}
          </p>

        </div>






        <div
          className="
            grid
            grid-cols-2
            gap-3
          "
        >


          <div
            className="
              rounded-xl
              bg-neutral-800
              p-4
            "
          >

            <p
              className="
                text-xs
                text-neutral-400
              "
            >
              ⚖️ Risk
            </p>


            <p
              className="
                mt-1
                text-white
              "
            >
              {
                consciousness.decision?.risk
                ?? "-"
              }
            </p>

          </div>





          <div
            className="
              rounded-xl
              bg-neutral-800
              p-4
            "
          >

            <p
              className="
                text-xs
                text-neutral-400
              "
            >
              🔄 Latest
            </p>


            <p
              className="
                mt-1
                text-sm
                text-white
              "
            >
              {
                consciousness.latestActivity?.message
                ??
                "Ei tapahtumia"
              }
            </p>

          </div>


        </div>


      </div>


    </section>

  )

}





export default SpacemonkeyConsciousnessCard
