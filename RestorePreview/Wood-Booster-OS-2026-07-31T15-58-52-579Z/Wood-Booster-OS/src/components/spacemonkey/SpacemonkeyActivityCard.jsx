import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
} from "../../api/client"





function SpacemonkeyActivityCard(){


  const [
    activities,
    setActivities
  ] = useState([])



  const [
    loading,
    setLoading
  ] = useState(true)







  useEffect(()=>{


    async function loadActivity(){


      try{


        const response =
          await apiGet(
            "/spacemonkey/activity"
          )



        setActivities(
          response.data || []
        )


      }


      catch(error){


        console.error(
          "Spacemonkey activity error",
          error
        )


      }


      finally{


        setLoading(false)


      }


    }



    loadActivity()



    const interval =
      setInterval(
        loadActivity,
        10000
      )



    return ()=>{


      clearInterval(
        interval
      )


    }


  },[])







  return (

    <section

      className="
        rounded-2xl
        p-5
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >




      <h2

        className="
          text-lg
          font-semibold
        "

      >

        🛰️ Spacemonkey Activity

      </h2>






      <p

        className="
          mt-1
          text-sm
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        Internal event history

      </p>







      {
        loading && (

          <p

            className="
              mt-5
              text-sm
            "

            style={{

              color:
                "var(--wood-muted)"

            }}

          >

            Loading activity...

          </p>

        )
      }








      {
        !loading &&
        activities.length === 0 && (

          <p

            className="
              mt-5
              text-sm
            "

            style={{

              color:
                "var(--wood-muted)"

            }}

          >

            No activity recorded.

          </p>

        )
      }









      <div

        className="
          mt-5
          space-y-3
        "

      >



        {
          activities
            .slice(0,5)
            .map(

              activity => (

                <div

                  key={
                    activity.id
                  }

                  className="
                    rounded-xl
                    p-3
                  "

                  style={{

                    background:
                      "var(--wood-panel-dark)",


                    border:
                      "1px solid var(--wood-border)"

                  }}

                >





                  <div

                    className="
                      flex
                      justify-between
                      gap-3
                    "

                  >



                    <p

                      className="
                        text-sm
                        font-semibold
                      "

                    >

                      {
                        activity.type
                      }

                    </p>





                    <p

                      className="
                        text-xs
                      "

                      style={{

                        color:
                          "var(--wood-accent)"

                      }}

                    >

                      {
                        activity.status
                      }

                    </p>




                  </div>







                  <p

                    className="
                      mt-2
                      text-sm
                    "

                    style={{

                      color:
                        "var(--wood-text)"

                    }}

                  >

                    {
                      activity.message
                    }

                  </p>








                  <p

                    className="
                      mt-2
                      text-xs
                    "

                    style={{

                      color:
                        "var(--wood-muted)"

                    }}

                  >

                    {
                      activity.module
                    }

                  </p>





                </div>

              )

            )

        }





      </div>





    </section>

  )

}





export default SpacemonkeyActivityCard
