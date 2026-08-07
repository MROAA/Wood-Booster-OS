import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





export default function SystemActivity(){


  const [
    events,
    setEvents,
  ] = useState([])



  const [
    loading,
    setLoading,
  ] = useState(true)







  async function loadActivity(){


    try{


      const response =
        await fetch(
          `${API_URL}/system/activity`
        )



      const data =
        await response.json()



      if(data.success){


        setEvents(
          data.events
        )


      }


    }
    catch(error){


      console.error(
        "System Activity error",
        error
      )


    }
    finally{


      setLoading(false)


    }


  }







  useEffect(()=>{


    loadActivity()


  },[])







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

          ▤ System Activity

        </h2>


        <p className="
          text-neutral-400
        ">

          Wood-Booster OS tapahtumaloki.

        </p>


      </div>







      {
        loading && (

          <p className="
            text-neutral-400
          ">

            Loading activity...

          </p>

        )
      }







      {
        !loading &&
        events.length === 0 && (

          <p className="
            text-neutral-500
          ">

            No system activity yet.

          </p>

        )
      }







      <div className="
        space-y-3
      ">


        {
          events.map(

            event => (

              <article

                key={event.id}

                className="
                  rounded-xl
                  border
                  border-neutral-800
                  bg-black
                  p-4
                "

              >


                <div className="
                  flex
                  justify-between
                  gap-4
                ">


                  <div>


                    <p className="
                      font-bold
                    ">

                      ● {event.type}

                    </p>



                    <p className="
                      text-sm
                      text-neutral-400
                    ">

                      {event.file}

                    </p>


                  </div>




                  <span className="
                    text-green-400
                  ">

                    {event.status}

                  </span>


                </div>





                <div className="
                  mt-3
                  text-xs
                  text-neutral-500
                ">


                  {event.version}

                  {" • "}

                  {
                    new Date(
                      event.time
                    ).toLocaleString()
                  }


                </div>


              </article>

            )

          )

        }


      </div>


    </section>

  )

}
