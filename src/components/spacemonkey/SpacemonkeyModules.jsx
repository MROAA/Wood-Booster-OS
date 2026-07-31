import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





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


        const response =
          await fetch(
            `${API_URL}/spacemonkey/system`
          )



        const data =
          await response.json()



        setModules(

          data
            ?.snapshot
            ?.modules || []

        )


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



    loadModules()


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

        Loading modules...

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

        Module error:
        {" "}
        {error}

      </section>

    )

  }







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

          Modules

        </h2>



        <p className="
          mt-2
          text-sm
          text-neutral-400
        ">

          Spacemonkey runtime modules.

        </p>


      </header>







      <div className="
        mt-6
        grid
        grid-cols-1
        gap-4
        md:grid-cols-2
      ">


        {
          modules.length === 0 && (

            <p className="
              text-neutral-500
            ">

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

    <article className="
      rounded-xl
      border
      border-neutral-800
      bg-black/30
      p-5
      transition-colors
      hover:border-neutral-700
    ">


      <div className="
        flex
        items-center
        justify-between
      ">


        <h3 className="
          font-semibold
          text-white
        ">

          {module.name}

        </h3>



        <Status />

      </div>







      <div className="
        mt-4
        space-y-2
        text-sm
      ">


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


      <p className="
        text-xs
        uppercase
        tracking-wider
        text-neutral-500
      ">

        {label}

      </p>


      <p className="
        text-neutral-300
      ">

        {value}

      </p>


    </div>

  )

}







function Status(){


  return (

    <span className="
      flex
      items-center
      gap-2
      text-xs
      text-green-400
    ">


      <span className="
        h-2
        w-2
        rounded-full
        bg-green-400
      "/>


      ACTIVE


    </span>

  )

}







export default SpacemonkeyModules
