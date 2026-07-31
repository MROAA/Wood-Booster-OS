import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
} from "../../api/client"





function SpacemonkeyCoreStatusCard(){


  const [
    core,
    setCore
  ] = useState(null)



  const [
    loading,
    setLoading
  ] = useState(true)







  useEffect(()=>{


    async function loadCore(){


      try{


        const response =
          await apiGet(
            "/spacemonkey/core"
          )


        setCore(
          response.data
        )


      }


      catch(error){


        console.error(
          "Spacemonkey core status error",
          error
        )


      }


      finally{


        setLoading(false)


      }


    }



    loadCore()



    const interval =
      setInterval(
        loadCore,
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

        Loading Spacemonkey Core...

      </section>

    )

  }







  if(!core){


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

        Spacemonkey Core offline

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


      <h2
        className="
          text-lg
          font-semibold
          text-white
        "
      >
        🛰️ Spacemonkey Core
      </h2>



      <p
        className="
          mt-1
          text-sm
          text-neutral-400
        "
      >
        Unified intelligence core status
      </p>





      <div
        className="
          mt-5
          space-y-3
        "
      >


        <div className="rounded-xl bg-neutral-800 p-3">

          <p className="text-xs text-neutral-400">
            Identity
          </p>

          <p className="mt-1 text-white font-semibold">
            {core.identity.name}
          </p>

        </div>





        <div className="rounded-xl bg-neutral-800 p-3">

          <p className="text-xs text-neutral-400">
            Creator
          </p>

          <p className="mt-1 text-white">
            {core.identity.creator}
          </p>

        </div>





        <div className="grid grid-cols-2 gap-3">

          <div className="rounded-xl bg-neutral-800 p-3">

            <p className="text-xs text-neutral-400">
              Safety
            </p>

            <p className="mt-1 text-green-400 font-semibold">
              {core.safety.status}
            </p>

          </div>



          <div className="rounded-xl bg-neutral-800 p-3">

            <p className="text-xs text-neutral-400">
              Snapshots
            </p>

            <p className="mt-1 text-white font-semibold">
              {core.safety.snapshots}
            </p>

          </div>

        </div>





        <div className="rounded-xl bg-neutral-800 p-3">

          <p className="text-xs text-neutral-400">
            Runtime
          </p>

          <p className="mt-1 text-green-400 font-semibold">
            {core.runtime?.state || "unknown"}
          </p>

        </div>





        <div className="rounded-xl bg-neutral-800 p-3">

          <p className="text-xs text-neutral-400">
            Memory
          </p>

          <p className="mt-1 text-white">
            {core.memory?.engine || "unknown"}
          </p>

          <p className="mt-1 text-sm text-neutral-400">
            Saved: {core.memory?.saved || 0}
          </p>

        </div>





        <div className="rounded-xl bg-neutral-800 p-3">

          <p className="text-xs text-neutral-400">
            🧠 Cognitive State
          </p>


          <p className="mt-1 text-white">
            State: {core.cognitive?.state || "unknown"}
          </p>


          <p className="mt-1 text-sm text-neutral-400">
            Thinking: {core.cognitive?.thinking || "-"}
          </p>


          <p className="mt-1 text-sm text-neutral-400">
            Goal: {core.cognitive?.goal || "-"}
          </p>


          <p className="mt-1 text-sm text-neutral-400">
            Next Action: {core.cognitive?.nextAction || "-"}
          </p>

        </div>





        <div className="rounded-xl bg-neutral-800 p-3">

          <p className="text-xs text-neutral-400">
            ⚖️ Decision State
          </p>


          <p className="mt-1 text-white">
            State: {core.decision?.state || "unknown"}
          </p>


          <p className="mt-1 text-sm text-neutral-400">
            Recommendation: {core.decision?.recommendation || "-"}
          </p>


          <p className="mt-1 text-sm text-neutral-400">
            Risk: {core.decision?.risk || "-"}
          </p>


          <p className="mt-1 text-sm text-neutral-400">
            Truth Score: {core.decision?.alignment?.truth || "-"}
          </p>

        </div>





        <div className="rounded-xl bg-neutral-800 p-3">

          <p className="text-xs text-neutral-400">
            🧬 Self Model
          </p>


          <p className="mt-1 text-white">
            {core.selfModel?.name || "unknown"}
          </p>


          <p className="mt-1 text-sm text-neutral-400">
            Version: {core.selfModel?.version || "-"}
          </p>


          <p className="mt-1 text-sm text-neutral-400">
            Capabilities: {core.selfModel?.capabilities || 0}
          </p>


          <p className="mt-1 text-sm text-neutral-400">
            Limitations: {core.selfModel?.limitations || 0}
          </p>

        </div>





        <div className="rounded-xl bg-neutral-800 p-3">

          <p className="text-xs text-neutral-400">
            Recovery
          </p>


          <p className="mt-1 text-white">
            {
              core.safety.recovery.available
                ? "Available"
                : "Unavailable"
            }
          </p>

        </div>





        <div className="rounded-xl bg-neutral-800 p-3">

          <p className="text-xs text-neutral-400">
            Purpose
          </p>


          <p className="mt-1 text-white text-sm">
            {core.identity.purpose}
          </p>

        </div>



      </div>


    </section>

  )

}





export default SpacemonkeyCoreStatusCard
