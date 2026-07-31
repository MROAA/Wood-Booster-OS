import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
} from "../../api/client"





function SpacemonkeyCoreCard(){


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
          "Spacemonkey Core error",
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

        Loading Spacemonkey Core...

      </section>

    )

  }







  if(!core){


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
            "1px solid var(--wood-warning)",


          color:
            "var(--wood-text)"

        }}

      >

        Spacemonkey Core offline

      </section>

    )

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

        🛰️ Spacemonkey Core

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

        Unified system status

      </p>









      <div

        className="
          mt-5
          grid
          gap-3
          md:grid-cols-2
        "

      >



        <InfoCard

          title="Status"

          value={core.status}

          accent

        />



        <InfoCard

          title="Identity"

          value={core.identity.name}

        />



        <InfoCard

          title="Creator"

          value={core.identity.creator}

        />



        <InfoCard

          title="Safety"

          value={core.safety.status}

          accent

        />



        <InfoCard

          title="Snapshots"

          value={core.safety.snapshots}

        />



        <InfoCard

          title="Recovery"

          value={
            core.safety.recovery.available
            ? "Available"
            : "Unavailable"
          }

        />


      </div>


    </section>

  )

}









function InfoCard({

  title,

  value,

  accent = false,

}){


  return (

    <div

      className="
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
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        {title}

      </p>



      <p

        className="
          mt-1
          font-semibold
        "

        style={{

          color:
            accent
            ? "var(--wood-accent)"
            : "var(--wood-text)"

        }}

      >

        {value}

      </p>


    </div>

  )

}







export default SpacemonkeyCoreCard
