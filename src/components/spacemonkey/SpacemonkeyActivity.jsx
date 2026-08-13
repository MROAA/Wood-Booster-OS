import {
  useEffect,
  useState,
} from "react"





const API_URL =
  "http://localhost:3001/api"







function SpacemonkeyActivity(){


  const [
    events,
    setEvents,
  ] = useState([])



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState(null)







  async function loadEvents(){


    try{


      const response =
        await fetch(
          `${API_URL}/spacemonkey/events`
        )



      const data =
        await response.json()



      setEvents(
        data.events || []
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







  useEffect(()=>{


    loadEvents()



    const timer =
      setInterval(

        loadEvents,

        5000

      )



    return ()=>{


      clearInterval(
        timer
      )


    }


  },[])







  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-6
    ">


      <header>


        <h2 className="
          text-xl
          font-bold
          text-white
        ">

          Activity Feed

        </h2>



        <p className="
          mt-2
          text-sm
          text-neutral-400
        ">

          Spacemonkey järjestelmätapahtumat.

        </p>


      </header>







      {
        loading && (

          <p className="
            mt-5
            text-neutral-500
          ">

            Loading events...

          </p>

        )
      }







      {
        error && (

          <p className="
            mt-5
            text-red-400
          ">

            Event error:
            {" "}
            {error}

          </p>

        )
      }







      {
        !loading &&
        !error &&
        events.length === 0 && (

          <p className="
            mt-5
            text-neutral-500
          ">

            No system events.

          </p>

        )
      }







      <div className="
        mt-6
        space-y-3
      ">


        {
          [...events]
            .reverse()
            .map(

              (event,index)=>(


                <EventCard

                  key={
                    event.id
                  }

                  event={
                    event
                  }

                  latest={
                    index === 0
                  }

                />


              )

            )
        }


      </div>


    </section>

  )

}







function EventCard({
  event,
  latest,
}){


  const style =
    getEventStyle(
      event.name
    )







  return (

    <article

      className={`
        rounded-xl
        border
        bg-black/30
        p-4
        transition
        duration-300
        hover:border-neutral-700
        ${latest ? "translate-x-1" : ""}
      `}

      style={{

        borderColor:
          style.border,

      }}

    >


      <div className="
        flex
        items-start
        justify-between
        gap-4
      ">


        <div>


          <div className="
            flex
            items-center
            gap-3
          ">


            <span className="
              h-2
              w-2
              rounded-full
              bg-green-400
            " />


            <h3 className="
              font-semibold
              text-white
            ">

              {event.name}

            </h3>


          </div>


          <p className="
            mt-2
            text-xs
            text-neutral-500
          ">

            {formatDate(
              event.timestamp
            )}

          </p>


        </div>





        <span className="
          rounded-full
          border
          border-neutral-700
          px-3
          py-1
          text-xs
          text-neutral-400
        ">

          {style.label}

        </span>


      </div>







      {
        event.payload && (

          <pre className="
            mt-4
            overflow-auto
            rounded-lg
            bg-black
            p-3
            text-xs
            text-neutral-300
          ">

            {
              JSON.stringify(
                event.payload,
                null,
                2
              )
            }

          </pre>

        )
      }


    </article>

  )

}







function getEventStyle(
  name
){


  if(
    name.includes(
      "COMMAND"
    )
  ){

    return {

      label:
        "COMMAND",

      border:
        "#44403c",

    }

  }



  if(
    name.includes(
      "SNAPSHOT"
    )
  ){

    return {

      label:
        "BACKUP",

      border:
        "#1e3a5f",

    }

  }



  if(
    name.includes(
      "SYSTEM"
    )
  ){

    return {

      label:
        "SYSTEM",

      border:
        "#14532d",

    }

  }



  return {

    label:
      "EVENT",

    border:
      "#262626",

  }


}







function formatDate(
  value
){


  return new Date(
    value
  ).toLocaleString(
    "fi-FI"
  )


}







export default SpacemonkeyActivity
