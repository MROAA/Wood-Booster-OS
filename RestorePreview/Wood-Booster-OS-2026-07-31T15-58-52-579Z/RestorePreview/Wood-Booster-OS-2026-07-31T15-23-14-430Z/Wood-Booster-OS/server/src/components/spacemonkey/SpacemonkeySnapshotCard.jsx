import {
  useEffect,
  useState,
} from "react"




const API_URL =
  "http://localhost:3001/api"





function SpacemonkeySnapshotCard(){


  const [
    snapshot,
    setSnapshot
  ] = useState(null)



  const [
    loading,
    setLoading
  ] = useState(true)







  async function loadSnapshot(){


    try{


      const response =

        await fetch(

          `${API_URL}/spacemonkey/core-snapshot`

        )



      const data =

        await response.json()



      if(data.success){


        setSnapshot(

          data.snapshot

        )


      }


    }


    catch(error){


      console.error(

        "Spacemonkey snapshot error",

        error

      )


      setSnapshot(null)


    }


    finally{


      setLoading(false)


    }


  }







  useEffect(()=>{


    loadSnapshot()


  },[])







  if(loading){


    return (

      <section
        className="
          rounded-2xl
          border
          border-neutral-800
          bg-neutral-900
          p-5
          text-neutral-400
        "
      >

        Loading Spacemonkey Snapshot...

      </section>

    )

  }







  if(!snapshot){


    return (

      <section
        className="
          rounded-2xl
          border
          border-red-900
          bg-neutral-900
          p-5
          text-red-400
        "
      >

        Snapshot unavailable

      </section>

    )

  }







  return (

    <section
      className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      "
    >


      <h2
        className="
          text-lg
          font-semibold
          text-white
        "
      >

        🧠 Spacemonkey Snapshot

      </h2>



      <div
        className="
          mt-4
          space-y-3
          text-sm
          text-neutral-300
        "
      >


        <p>

          Status:

          <span
            className="
              ml-2
              text-green-400
            "
          >

            {snapshot.status}

          </span>

        </p>




        <p>

          Core version:

          <span className="ml-2">

            {snapshot.core?.version}

          </span>

        </p>




        <p>

          Core modules:

          <span className="ml-2">

            {snapshot.core?.modules}

          </span>

        </p>




        <div>

          Loaded modules:

          <ul
            className="
              mt-2
              list-disc
              pl-5
              text-neutral-400
            "
          >

            {
              snapshot.core?.names?.map(

                module => (

                  <li key={module}>

                    {module}

                  </li>

                )

              )
            }

          </ul>

        </div>




        <p>

          Recovery:

          <span className="ml-2">

            {
              snapshot.recovery?.available
                ? "Available"
                : "Disabled"
            }

          </span>

        </p>




        <p>

          Approval:

          <span className="ml-2">

            {
              snapshot.recovery?.approvalRequired
                ? "Required"
                : "Not required"
            }

          </span>

        </p>



      </div>





      <button
        disabled
        className="
          mt-5
          rounded-xl
          border
          border-neutral-700
          bg-neutral-800
          px-4
          py-2
          text-sm
          text-neutral-400
          cursor-not-allowed
        "
      >

        Restore Snapshot

      </button>



    </section>

  )

}





export default SpacemonkeySnapshotCard
