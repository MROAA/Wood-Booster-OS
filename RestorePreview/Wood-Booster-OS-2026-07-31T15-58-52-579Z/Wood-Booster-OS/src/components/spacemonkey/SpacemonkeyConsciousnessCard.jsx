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







  useEffect(()=>{


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

      <PanelMessage>

        Loading consciousness...

      </PanelMessage>

    )

  }







  if(!consciousness){


    return (

      <PanelMessage warning>

        Consciousness offline

      </PanelMessage>

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





      <header

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
            "

          >

            🧠 Spacemonkey Consciousness

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

            Current intelligence state

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


            border:
              "1px solid var(--wood-border)",


            color:
              "var(--wood-accent)"

          }}

        >

          ACTIVE

        </div>



      </header>









      <div

        className="
          mt-5
          grid
          gap-3
          md:grid-cols-2
        "

      >





        <InfoBlock

          title="🧠 State"

          value={
            consciousness.state ||
            "idle"
          }

        />






        <InfoBlock

          title="⚖️ Risk"

          value={
            consciousness.decision?.risk
            ??
            "-"
          }

        />







        <InfoBlock

          wide

          title="🎯 Current Goal"

          value={
            consciousness.goal
            ||
            "Ei aktiivista tavoitetta"
          }

        />







        <InfoBlock

          wide

          title="➡️ Next Action"

          value={
            consciousness.nextAction
            ||
            "Odottaa seuraavaa tehtävää"
          }

        />







        <InfoBlock

          wide

          title="🧩 Decision"

          value={
            consciousness.decision?.name
            ||
            "Ei aktiivista päätöstä"
          }

        />





      </div>




    </section>

  )

}









function InfoBlock({

  title,

  value,

  wide = false,

}){


  return (

    <div

      className={`
        rounded-xl
        p-4
        ${wide ? "md:col-span-2" : ""}
      `}

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
            "var(--wood-text)"

        }}

      >

        {value}

      </p>



    </div>

  )

}









function PanelMessage({

  children,

  warning = false,

}){


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
          warning
          ?
          "1px solid var(--wood-warning)"
          :
          "1px solid var(--wood-border)",


        color:
          "var(--wood-text)"

      }}

    >

      {children}

    </section>

  )

}







export default SpacemonkeyConsciousnessCard
