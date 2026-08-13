import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
} from "../api/client"


import SpacemonkeyDashboard from "../components/spacemonkey/SpacemonkeyDashboard"


import {
  adaptSpacemonkeyDashboard,
} from "../services/spacemonkeyDashboardAdapter"





function SpacemonkeyBrain() {


  const [
    core,
    setCore
  ] = useState(null)

const [
  activities,
  setActivities
] = useState([])

  const [
    connection,
    setConnection
  ] = useState("CHECKING")


  const [
    error,
    setError
  ] = useState("")







  async function loadSpacemonkey() {


    try {

      setError("")


      const data =
        await apiGet(
          "/spacemonkey/state"
        )





if(
  data.success
) {


  setCore(

    adaptSpacemonkeyDashboard(
      data.data
    )

  )


  setActivities(
    data.data.activity || []
  )


  setConnection(
    "ONLINE"
  )


} else {


  setConnection(
    "OFFLINE"
  )


  setError(
    data.error ||
    "Spacemonkey-tilan lataaminen epäonnistui."
  )


}


    }


    catch(loadError) {


      console.error(
        loadError
      )


      setConnection(
        "OFFLINE"
      )


      setError(
        loadError.message ||
        "Spacemonkey-tilan lataaminen epäonnistui."
      )


    }


  }







  useEffect(() => {


    loadSpacemonkey()



    const interval =
      setInterval(
        loadSpacemonkey,
        10000
      )



    return () =>
      clearInterval(
        interval
      )


  }, [])







  if(!core) {


    return (

      <div
        className="
          space-y-5
        "
      >

        {
          error && (

            <div className="panel text-red-400">
              {error}
            </div>

          )
        }


        <div
          className="
            panel
            p-6
          "
        >

          {
            error
            ?
            "Spacemonkey Coreen ei saada yhteyttä."
            :
            "Loading Spacemonkey Core..."
          }

        </div>

      </div>

    )

  }







  return (

    <div
      className="
        w-full
        flex
        flex-col
        gap-6
      "
    >


      <header>

        <h1
          className="
            text-4xl
            brand-font
            text-[var(--wood-text)]
          "
        >

          Spacemonkey Brain

        </h1>


        <p
          className="
            mt-2
            text-sm
            text-[var(--wood-muted)]
          "
        >

          Wood-Booster HQ Operator

          {" • "}

          {connection}

        </p>


      </header>





      <SpacemonkeyDashboard

        core={
          core
        }

        connection={
          connection
        }

        activities={
          activities
        }

      />


    </div>

  )

}



export default SpacemonkeyBrain
