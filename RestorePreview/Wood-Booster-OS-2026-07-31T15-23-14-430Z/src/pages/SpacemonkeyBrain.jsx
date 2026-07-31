import {
  useEffect,
  useState,
} from "react"


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







  async function loadSpacemonkey() {


    try {


      const response =
        await fetch(
          "http://localhost:3001/api/spacemonkey/state"
        )



      const data =
        await response.json()





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


}


      setConnection(
        "ONLINE"
      )


    }


    catch(error) {


      console.error(
        error
      )


      setConnection(
        "OFFLINE"
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
          panel
          p-6
        "
      >

        Loading Spacemonkey Core...

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

          Wood-Booster OS Operator

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
