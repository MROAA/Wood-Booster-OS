import {
  useEffect,
  useState,
} from "react"





const API_URL =
  "http://localhost:3001/api"





function SpacemonkeySecurity(){


  const [
    security,
    setSecurity,
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


    async function loadSecurity(){


      try{


        const response =
          await fetch(
            `${API_URL}/spacemonkey/safety`
          )



        const data =
          await response.json()



        setSecurity(
          data.data
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



    loadSecurity()


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

        Loading Security...

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

        Security error:
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

          Security Center

        </h2>



        <p className="
          mt-2
          text-sm
          text-neutral-400
        ">

          Spacemonkey safety and recovery layer.

        </p>


      </header>







      <div className="
        mt-6
        grid
        grid-cols-1
        gap-4
        md:grid-cols-2
      ">


        <SecurityCard

          title="Snapshot Protection"

          value={
            security.snapshots.count
            + " snapshots"
          }

        />



        <SecurityCard

          title="Recovery System"

          value={
            security.recovery.available
            ? "AVAILABLE"
            : "OFFLINE"
          }

        />



        <SecurityCard

          title="Safety Layer"

          value="ENABLED"

        />



        <SecurityCard

          title="Restore Protection"

          value="ACTIVE"

        />


      </div>


    </section>

  )

}







function SecurityCard({
  title,
  value,
}){


  return (

    <article className="
      rounded-xl
      border
      border-neutral-800
      bg-black/30
      p-5
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
        mt-3
        flex
        items-center
        gap-2
        text-green-400
      ">


        <span className="
          h-2
          w-2
          rounded-full
          bg-green-400
        "/>


        {value}


      </div>


    </article>

  )

}







export default SpacemonkeySecurity
