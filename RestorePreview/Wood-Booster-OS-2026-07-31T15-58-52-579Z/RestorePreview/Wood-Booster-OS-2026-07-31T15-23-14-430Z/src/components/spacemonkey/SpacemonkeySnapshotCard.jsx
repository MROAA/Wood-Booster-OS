import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"






function SpacemonkeySnapshotCard(){


  const [
    snapshot,
    setSnapshot
  ] = useState(null)



  const [
    loading,
    setLoading
  ] = useState(true)







  useEffect(()=>{


    async function loadSnapshot(){


      try{


        const response =

          await fetch(
            `${API_URL}/spacemonkey/snapshot`
          )



        const data =

          await response.json()



        setSnapshot(
          data.response
        )


      }


      catch(error){


        console.error(
          "Snapshot error:",
          error
        )


      }


      finally{


        setLoading(false)


      }


    }



    loadSnapshot()


  },[])







  if(loading){


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
            "1px solid var(--wood-border)",


          color:
            "var(--wood-muted)"

        }}

      >

        Loading Snapshot...

      </section>

    )

  }







  if(!snapshot){


    return null


  }







  const moduleCount =

    snapshot.core?.modules
      ?.count

    ??

    snapshot.core?.modules

    ??

    0







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

        🧠 Spacemonkey Snapshot

      </h2>







      <div

        className="
          mt-5
          space-y-3
          text-sm
        "

      >



        <StatusRow

          label="Status"

          value={
            snapshot.health?.loader
            ? "READY"
            : "UNKNOWN"
          }

        />



        <StatusRow

          label="Core"

          value={
            snapshot.core?.status ||
            "UNKNOWN"
          }

        />



        <StatusRow

          label="Modules"

          value={
            moduleCount
          }

        />



        <StatusRow

          label="Safe Mode"

          value={
            snapshot.runtime?.safeMode
            ? "ON"
            : "OFF"
          }

        />



      </div>








      <button

        className="
          mt-5
          rounded-xl
          px-4
          py-2
          text-sm
          font-semibold
        "

        style={{

          background:
            "var(--wood-panel-dark)",


          border:
            "1px solid var(--wood-border)",


          color:
            "var(--wood-text)"

        }}

      >

        Restore Snapshot

      </button>





    </section>

  )

}









function StatusRow({

  label,

  value,

}){


  return (

    <div

      className="
        flex
        justify-between
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



      <span

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        {label}

      </span>





      <span

        className="
          font-semibold
        "

        style={{

          color:
            "var(--wood-accent)"

        }}

      >

        {value}

      </span>



    </div>

  )

}






export default SpacemonkeySnapshotCard
