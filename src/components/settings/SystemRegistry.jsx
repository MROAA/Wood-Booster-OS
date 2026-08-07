import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





export default function SystemRegistry(){


  const [
    registry,
    setRegistry,
  ] = useState(null)



  const [
    loading,
    setLoading,
  ] = useState(true)



  async function loadRegistry(){


    try{


      const response =
        await fetch(
          `${API_URL}/system/registry`
        )



      const data =
        await response.json()



      if(data.success){


        setRegistry(
          data.registry
        )


      }


    }
    catch(error){


      console.error(
        "System Registry error",
        error
      )


    }
    finally{


      setLoading(false)


    }


  }







  useEffect(()=>{


    loadRegistry()


  },[])







  if(loading){


    return (

      <section className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      ">

        Loading System Registry...

      </section>

    )

  }







  if(!registry){


    return (

      <section className="
        rounded-2xl
        border
        border-red-900
        bg-neutral-900
        p-5
      ">

        System Registry unavailable

      </section>

    )

  }







  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-5
    ">


      <div className="
        mb-5
      ">

        <h2 className="
          text-2xl
          font-bold
        ">

          ⊞ Live System Registry

        </h2>


        <p className="
          text-neutral-400
        ">

          Backend system modules.

        </p>


      </div>







      <div className="
        grid
        grid-cols-1
        gap-4
        md:grid-cols-3
      ">


        <div className="
          rounded-xl
          border
          border-neutral-800
          bg-black
          p-4
        ">

          <p className="
            text-sm
            text-neutral-500
          ">

            System

          </p>


          <p className="
            mt-2
            font-bold
          ">

            {registry.system.name}

          </p>


        </div>





        <div className="
          rounded-xl
          border
          border-neutral-800
          bg-black
          p-4
        ">

          <p className="
            text-sm
            text-neutral-500
          ">

            Version

          </p>


          <p className="
            mt-2
            font-bold
          ">

            {registry.system.version}

          </p>


        </div>





        <div className="
          rounded-xl
          border
          border-neutral-800
          bg-black
          p-4
        ">

          <p className="
            text-sm
            text-neutral-500
          ">

            Status

          </p>


          <p className="
            mt-2
            text-green-400
            font-bold
          ">

            ● {registry.status}

          </p>


        </div>


      </div>







      <div className="
        mt-6
        space-y-3
      ">


        <h3 className="
          font-bold
        ">

          Loaded Modules

        </h3>




        {
          registry.modules.map(

            module => (

              <div

                key={module.id}

                className="
                  flex
                  justify-between
                  rounded-xl
                  border
                  border-neutral-800
                  bg-black
                  p-4
                "

              >

                <div>

                  <p className="
                    font-bold
                  ">

                    {module.name}

                  </p>


                  <p className="
                    text-xs
                    text-neutral-500
                  ">

                    {module.id}

                  </p>


                </div>


                <span className="
                  text-green-400
                ">

                  ● {module.status}

                </span>


              </div>

            )

          )

        }


      </div>


    </section>

  )

}
