import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





function SpacemonkeyRuntime(){


  const [
    runtime,
    setRuntime,
  ] = useState(null)



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState(null)







  useEffect(()=>{


    async function loadRuntime(){


      try{


        const [
          systemResponse,
          healthResponse,
        ] =
        await Promise.all([


          fetch(
            `${API_URL}/spacemonkey/system`
          )
          .then(
            r=>r.json()
          ),


          fetch(
            `${API_URL}/health`
          )
          .then(
            r=>r.json()
          ),


        ])





        setRuntime({

          system:
            systemResponse.snapshot,

          health:
            healthResponse,

        })


      }
      catch(error){


        setError(
          error.message
        )


      }
      finally{


        setLoading(false)


      }


    }



    loadRuntime()


  },[])







  if(loading){


    return (

      <section className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-6
      ">

        Loading Runtime...

      </section>

    )

  }







  if(error){


    return (

      <section className="
        rounded-2xl
        border
        border-red-900
        bg-neutral-900
        p-6
        text-red-400
      ">

        Runtime error:
        {" "}
        {error}

      </section>

    )

  }







  const system =
    runtime.system







  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-6
      transition-colors
      hover:border-neutral-700
    ">


      <header>


        <h2 className="
          text-xl
          font-bold
          text-white
        ">

          Runtime

        </h2>



        <p className="
          mt-2
          text-sm
          text-neutral-400
        ">

          Spacemonkey system runtime status.

        </p>


      </header>







      <div className="
        mt-6
        grid
        grid-cols-1
        gap-4
        md:grid-cols-2
      ">


        <RuntimeCard

          title="Backend"

          value={
            runtime.health.status === "ok"
            ? "CONNECTED"
            : "OFFLINE"
          }

        />



        <RuntimeCard

          title="Kernel"

          value={
            system.core.status
          }

        />



        <RuntimeCard

          title="Modules"

          value={
            `${system.modules.length} loaded`
          }

        />



        <RuntimeCard

          title="Health"

          value={
            system.health.status
          }

        />


      </div>


    </section>

  )

}







function RuntimeCard({
  title,
  value,
}){


  return (

    <article className="
      rounded-xl
      border
      border-neutral-800
      bg-black/30
      p-4
    ">


      <p className="
        text-xs
        uppercase
        tracking-wider
        text-neutral-500
      ">

        {title}

      </p>


      <div className="
        mt-2
        flex
        items-center
        gap-2
      ">


        <span className="
          h-2
          w-2
          rounded-full
          bg-green-400
        "/>


        <span className="
          text-green-400
        ">

          {value}

        </span>


      </div>


    </article>

  )

}







export default SpacemonkeyRuntime
