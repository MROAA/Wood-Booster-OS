import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
} from "../../api/client"





function SpacemonkeySafetyCard(){


  const [
    safety,
    setSafety
  ] = useState(null)



  const [
    loading,
    setLoading
  ] = useState(true)



  const [
    error,
    setError
  ] = useState(null)







  useEffect(()=>{


    async function loadSafety(){


      try {


        const response =
          await apiGet(
            "/spacemonkey/safety"
          )



        setSafety(
          response.data
        )


      }


      catch(error){


        console.error(
          "Spacemonkey safety error",
          error
        )


        setError(
          error.message
        )


      }


      finally {


        setLoading(false)


      }


    }



    loadSafety()


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




      <h3

        className="
          text-xl
          font-semibold
        "

      >

        🛰️ Spacemonkey Safety

      </h3>





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

        Turvallisuusjärjestelmän tila

      </p>









      {
        loading && (

          <p

            className="
              mt-4
              text-sm
            "

            style={{

              color:
                "var(--wood-muted)"

            }}

          >

            Ladataan...

          </p>

        )
      }









      {
        error && (

          <p

            className="
              mt-4
              rounded-xl
              p-3
            "

            style={{

              background:
                "var(--wood-panel-dark)",


              border:
                "1px solid var(--wood-warning)",


              color:
                "var(--wood-text)"

            }}

          >

            {error}

          </p>

        )
      }









      {
        safety && (

          <div

            className="
              mt-5
              space-y-3
            "

          >





            <InfoBlock

              title="Status"

              value={safety.status}

              accent

            />







            <div

              className="
                grid
                grid-cols-2
                gap-3
              "

            >



              <InfoBlock

                title="Snapshots"

                value={
                  safety.snapshots.count
                }

                large

              />





              <InfoBlock

                title="Pending Recovery"

                value={
                  safety.recovery.pending
                }

                large

              />


            </div>









            <InfoBlock

              title="Latest Audit"

              value={
                safety.audit.latest?.event
                ||
                "Ei tapahtumia"
              }

            />




          </div>

        )
      }






    </section>

  )

}









function InfoBlock({

  title,

  value,

  accent = false,

  large = false,

}){


  return (

    <div

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

      <p

        className="
          text-xs
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        {title}

      </p>





      <p

        className={`
          mt-1
          font-semibold
          ${large ? "text-xl" : "text-sm"}
        `}

        style={{

          color:
            accent
            ? "var(--wood-accent)"
            : "var(--wood-text)"

        }}

      >

        {value}

      </p>


    </div>

  )

}







export default SpacemonkeySafetyCard
