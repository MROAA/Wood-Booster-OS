import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
} from "../../api/client"





function SpacemonkeyMindCard(){


  const [
    mind,
    setMind
  ] = useState(null)



  const [
    loading,
    setLoading
  ] = useState(true)







  async function loadMind(){


    try{


      const response =
        await apiGet(
          "/spacemonkey/core"
        )



      setMind(
        response.data
      )


    }


    catch(error){


      console.error(
        "Spacemonkey mind error",
        error
      )


    }


    finally{


      setLoading(false)


    }


  }







  useEffect(()=>{


    loadMind()



    const interval =
      setInterval(
        loadMind,
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

        Loading Spacemonkey...

      </section>

    )

  }







  if(!mind){


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

        Spacemonkey offline

      </section>

    )

  }







  return (

    <section

      className="
        rounded-2xl
        p-6
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
              text-2xl
              font-semibold
            "

          >

            🛰️ Spacemonkey Mind

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

            Marcin digitaalinen työpari

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
              "var(--wood-panel-dark)",


            color:
              "var(--wood-accent)",


            border:
              "1px solid var(--wood-border)"

          }}

        >

          ACTIVE

        </div>




      </div>








      <div

        className="
          mt-6
          space-y-4
        "

      >



        <MindBlock

          title="🛰️ Identity"

          value={
            mind.identity?.name
          }

          extra={
            `Creator: ${mind.identity?.creator || "-"}`
          }

        />





        <MindBlock

          title="🎯 Current Mission"

          value={
            mind.cognitive?.goal
            ||
            "Ei aktiivista tehtävää"
          }

        />





        <MindBlock

          title="🧠 Thinking"

          value={
            mind.cognitive?.thinking
            ||
            "Analysoi tilannetta"
          }

        />





        <MindBlock

          title="➡️ Next Action"

          value={
            mind.cognitive?.nextAction
            ||
            "Odottaa tehtävää"
          }

        />





        <MindBlock

          title="🛡️ Safety"

          value={
            mind.safety?.status
            ||
            "unknown"
          }

          accent

        />



      </div>


    </section>

  )

}









function MindBlock({

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
          uppercase
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
          mt-2
          text-sm
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





export default SpacemonkeyMindCard
