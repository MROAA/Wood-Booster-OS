import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
} from "../../api/client"




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

          apiGet(
            "/spacemonkey/system"
          ),

          apiGet(
            "/health"
          ),

        ])




        setRuntime({

          system:
            systemResponse.snapshot,

          health:
            healthResponse,

        })


      }
      catch(loadError){


        setError(
          loadError.message
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

      <section className="panel p-6">

        Loading Runtime...

      </section>

    )

  }




  if(error){


    return (

      <section className="panel text-red-400">

        Runtime error:
        {" "}
        {error}

      </section>

    )

  }




  const system =
    runtime.system




  return (

    <section className="card p-6 wood-hover">


      <header>


        <h2 className="text-sm uppercase tracking-widest text-[var(--wood-muted)]">

          Runtime

        </h2>



        <p className="mt-2 text-sm text-[var(--wood-muted)]">

          Spacemonkey system runtime status.

        </p>


      </header>




      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">


        <RuntimeStat

          title="Backend"

          value={
            runtime.health.status === "ok"
            ? "CONNECTED"
            : "OFFLINE"
          }

          healthy={
            runtime.health.status === "ok"
          }

        />



        <RuntimeStat

          title="Kernel"

          value={
            system.core.status
          }

          healthy={
            system.core.status === "active" ||
            system.core.status === "healthy"
          }

        />



        <RuntimeStat

          title="Modules"

          value={
            `${system.modules.length} loaded`
          }

          healthy={
            system.modules.length > 0
          }

        />



        <RuntimeStat

          title="Health"

          value={
            system.health.status
          }

          healthy={
            system.health.status === "healthy"
          }

        />


      </div>


    </section>

  )

}




function RuntimeStat({
  title,
  value,
  healthy,
}){


  const colorClass =
    healthy
    ?
    "text-green-400"
    :
    "text-red-400"


  const dotClass =
    healthy
    ?
    "bg-green-400"
    :
    "bg-red-400"


  return (

    <article className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-card)] p-4">


      <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">

        {title}

      </p>



      <div className={`mt-2 flex items-center gap-2 ${colorClass}`}>


        <span className={`h-2 w-2 rounded-full ${dotClass}`} />


        <span>

          {value}

        </span>


      </div>


    </article>

  )

}




export default SpacemonkeyRuntime
