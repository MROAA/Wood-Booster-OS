import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





function VersionControl(){


  const [
    snapshot,
    setSnapshot,
  ] = useState(null)



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState(null)







  async function loadSnapshot(){


    try{


      setLoading(true)



      const response =
        await fetch(
          `${API_URL}/spacemonkey/snapshot-v3`
        )



      const data =
        await response.json()



      if(!response.ok){

        throw new Error(
          data.error ||
          "Snapshot loading failed"
        )

      }



      setSnapshot(
        data.snapshot
      )


    }


    catch(error){


      console.error(
        "Snapshot error:",
        error
      )


      setError(
        error.message
      )


    }


    finally{


      setLoading(false)


    }


  }







  useEffect(()=>{


    loadSnapshot()


  },[])








  function createSnapshot(){


    alert(
      "Snapshot creation API valmistellaan"
    )


  }







  function restoreSnapshot(){


    alert(
      "Restore API valmistellaan"
    )


  }







  if(loading){


    return (

      <section className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      ">

        Loading Spacemonkey Snapshot...

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
        p-5
        text-red-400
      ">

        Snapshot error:
        {" "}
        {error}

      </section>

    )

  }







  return (

    <section>


      <div className="
        mb-4
        flex
        items-center
        justify-between
      ">


        <div>


          <h2 className="
            text-2xl
            font-bold
          ">

            🛡️ Version Control

          </h2>



          <p className="
            text-neutral-400
          ">

            Spacemonkey järjestelmän palautuspisteet.

          </p>


        </div>




        <button

          onClick={createSnapshot}

          className="
            rounded-xl
            bg-amber-500
            px-4
            py-3
            font-bold
            text-black
          "

        >

          Create Snapshot

        </button>


      </div>







      <div className="
        grid
        grid-cols-1
        gap-4
        md:grid-cols-3
      ">


        <InfoCard

          title="System"

          value={
            snapshot?.manifest?.system ||
            "-"
          }

        />



        <InfoCard

          title="Version"

          value={
            snapshot?.version ||
            "-"
          }

        />



        <InfoCard

          title="Status"

          value={
            snapshot?.status ||
            "-"
          }

        />


      </div>







      <div className="
        mt-6
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      ">


        <h3 className="
          text-xl
          font-bold
        ">

          Kernel

        </h3>




        <p className="
          mt-2
          text-neutral-400
        ">

          Core:

          {" "}

          {
            snapshot?.kernel?.core?.status ||
            "-"
          }

        </p>




        <p className="
          text-neutral-400
        ">

          Modules:

          {" "}

          {
            snapshot?.kernel?.modules?.length ||
            0
          }

        </p>


      </div>







      <div className="
        mt-4
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      ">


        <h3 className="
          text-xl
          font-bold
        ">

          Health

        </h3>




        {
          snapshot?.health?.checks?.map(

            check => (

              <div
                key={check.name}
                className="
                  mt-2
                  text-neutral-300
                "
              >

                🟢 {check.name}

                {" : "}

                {check.status}


              </div>

            )

          )
        }


      </div>







      <button

        onClick={restoreSnapshot}

        className="
          mt-5
          rounded-xl
          border
          border-neutral-700
          px-5
          py-3
          text-sm
        "

      >

        Restore System

      </button>



    </section>

  )

}








function InfoCard({
  title,
  value,
}){


  return (

    <article className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-5
    ">


      <p className="
        text-sm
        text-neutral-500
      ">

        {title}

      </p>


      <p className="
        mt-2
        text-xl
        font-bold
      ">

        {value}

      </p>


    </article>

  )

}





export default VersionControl
