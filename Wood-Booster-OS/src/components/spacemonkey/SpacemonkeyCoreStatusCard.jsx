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

        Loading Core...

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

        Core offline

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
              text-xl
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

            Core intelligence status

          </p>


        </div>





        <div

          className="
            rounded-full
            px-3
            py-1
            text-xs
            font-semibold
          "

          style={{

            background:
              "var(--wood-accent-soft)",


            color:
              "var(--wood-accent)"

          }}

        >

          ACTIVE

        </div>



      </div>









      <div

        className="
          mt-5
          grid
          gap-3
          md:grid-cols-2
        "

      >




        <InfoCard

          title="Identity"

          value={
            core.identity?.name
          }

          extra={
            `Creator: ${core.identity?.creator || "-"}`
          }

        />






        <InfoCard

          title="Safety"

          value={
            core.safety?.status
          }

          accent

        />






        <InfoCard

          title="Memory"

          value={
            `${core.memory?.saved || 0} memories`
          }

        />






        <InfoCard

          title="Runtime"

          value={
            core.runtime?.state || "unknown"
          }

        />





      </div>








      <div

        className="
          mt-4
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
            text-xs
          "

          style={{

            color:
              "var(--wood-muted)"

          }}

        >

          Purpose

        </p>




        <p

          className="
            mt-2
            text-sm
          "

          style={{

            color:
              "var(--wood-text)"

          }}

        >

          Auttaa rakentamaan, oppimaan ja kehittymään yhdessä käyttäjän kanssa.

        </p>


      </div>


    </section>

  )

}









function InfoCard({

  title,

  value,

  extra,

  accent = false,

}){


  return (

    <div

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





      {
        extra && (

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

            {extra}

          </p>

        )
      }



    </div>

  )

}







export default SpacemonkeyCoreStatusCard
