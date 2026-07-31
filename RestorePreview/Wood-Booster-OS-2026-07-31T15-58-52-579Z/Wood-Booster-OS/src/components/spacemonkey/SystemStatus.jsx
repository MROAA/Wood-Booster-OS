import {
  useEffect,
  useState,
} from "react"





function SystemStatus(){


  const [
    system,
    setSystem
  ] = useState({

    cpu:18,

    memory:42,

    status:"NORMAL",

  })







  useEffect(()=>{


    const interval =

      setInterval(()=>{


        setSystem({

          cpu:
            Math.floor(
              Math.random() * 40
            ) + 10,


          memory:
            Math.floor(
              Math.random() * 35
            ) + 30,


          status:
            "NORMAL",

        })


      },5000)



    return ()=>{

      clearInterval(interval)

    }


  },[])








  return (

    <section

      className="
        rounded-3xl
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
          mb-6
        "

      >

        <p

          className="
            text-xs
            uppercase
            tracking-[0.3em]
          "

          style={{

            color:
              "var(--wood-accent)"

          }}

        >

          System Monitor

        </p>




        <h2

          className="
            mt-2
            text-xl
            font-semibold
          "

        >

          Core Status

        </h2>


      </div>









      <div

        className="
          mb-6
          flex
          items-center
          gap-3
          rounded-2xl
          p-4
        "

        style={{

          background:
            "var(--wood-panel-dark)",


          border:
            "1px solid var(--wood-border)"

        }}

      >



        <span

          className="
            h-3
            w-3
            animate-pulse
            rounded-full
          "

          style={{

            background:
              "var(--wood-green)"

          }}

        />




        <div>


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

            GLOBAL STATUS

          </p>




          <p

            className="
              font-semibold
            "

            style={{

              color:
                "var(--wood-text)"

            }}

          >

            {system.status}

          </p>


        </div>


      </div>









      <StatusBar

        label="CPU"

        value={
          system.cpu
        }

      />



      <StatusBar

        label="Memory"

        value={
          system.memory
        }

      />




    </section>

  )

}








function StatusBar({

  label,

  value,

}){



  return (

    <div

      className="
        mb-5
      "

    >



      <div

        className="
          mb-2
          flex
          justify-between
          text-sm
        "

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

        >

          {value}%

        </span>


      </div>








      <div

        className="
          h-3
          overflow-hidden
          rounded-full
        "

        style={{

          background:
            "var(--wood-panel-dark)"

        }}

      >



        <div

          className="
            h-full
            rounded-full
            transition-all
          "

          style={{

            width:
              `${value}%`,


            background:
              "var(--wood-accent)"

          }}

        />


      </div>


    </div>

  )

}







export default SystemStatus
