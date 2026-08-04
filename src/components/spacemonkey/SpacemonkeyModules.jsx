import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
} from "../../api/client"




function SpacemonkeyModules(){


  const [
    modules,
    setModules,
  ] = useState([])



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState(null)




  useEffect(()=>{


    async function loadModules(){


      try{


        const data =
          await apiGet(
            "/spacemonkey/system"
          )



        setModules(

          data
            ?.snapshot
            ?.modules || []

        )


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



    loadModules()


  },[])




  if(loading){


    return (

      <section className="panel p-6">

        Loading modules...

      </section>

    )

  }




  if(error){


    return (

      <section className="panel text-red-400">

        Module error:
        {" "}
        {error}

      </section>

    )

  }




  return (

    <section className="card p-6 wood-hover">


      <header>


        <h2 className="text-sm uppercase tracking-widest text-[var(--wood-muted)]">

          Modules

        </h2>



        <p className="mt-2 text-sm text-[var(--wood-muted)]">

          Spacemonkey runtime modules.

        </p>


      </header>




      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">


        {
          modules.length === 0 && (

            <p className="text-sm text-[var(--wood-muted)]">

              No modules registered.

            </p>

          )
        }



        {
          modules.map(

            module => (

              <ModuleCard

                key={
                  module.id
                }

                module={
                  module
                }

              />

            )

          )
        }


      </div>


    </section>

  )

}




function ModuleCard({
  module,
}){


  return (

    <article className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-card)] p-5">


      <div className="flex items-center justify-between">


        <h3 className="font-semibold">

          {module.name}

        </h3>



        <ModuleStatus
          state={
            module.state
          }
        />


      </div>




      <div className="mt-4 space-y-2 text-sm">


        <Info

          label="ID"

          value={
            module.id
          }

        />



        <Info

          label="Version"

          value={
            module.version || "unknown"
          }

        />



        <Info

          label="State"

          value={
            module.state
          }

        />


      </div>


    </article>

  )

}




function Info({
  label,
  value,
}){


  return (

    <div>


      <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">

        {label}

      </p>



      <p className="text-[var(--wood-text)]">

        {value}

      </p>


    </div>

  )

}




function ModuleStatus({
  state,
}){


  const isActive =
    state === "active" ||
    state === "healthy"


  const isUnknown =
    !state ||
    state === "unknown"


  const colorClass =
    isActive
    ?
    "text-green-400"
    :
    isUnknown
    ?
    "text-[var(--wood-muted)]"
    :
    "text-red-400"


  const dotClass =
    isActive
    ?
    "bg-green-400"
    :
    isUnknown
    ?
    "bg-[var(--wood-muted)]"
    :
    "bg-red-400"


  return (

    <span className={`flex items-center gap-2 text-xs ${colorClass}`}>


      <span className={`h-2 w-2 rounded-full ${dotClass}`} />


      {
        (state || "unknown").toUpperCase()
      }


    </span>

  )

}




export default SpacemonkeyModules
