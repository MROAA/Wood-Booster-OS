import {
  useEffect,
  useState,
} from "react"


import SpacemonkeyIdentity from "./SpacemonkeyIdentity"

import SpacemonkeySystemCard from "./SpacemonkeySystemCard"

import SpacemonkeyContextCard from "./SpacemonkeyContextCard"

import SpacemonkeyNextStep from "./SpacemonkeyNextStep"

import SpacemonkeyDecisionCard from "./SpacemonkeyDecisionCard"

import SpacemonkeyMemoryCard from "./SpacemonkeyMemoryCard"

import SpacemonkeyPipeline from "./SpacemonkeyPipeline"

import SpacemonkeyRuntimeCard from "./SpacemonkeyRuntimeCard"

import SpacemonkeyCognitiveStateCard from "./SpacemonkeyCognitiveStateCard"

import SpacemonkeySafetyCard from "./SpacemonkeySafetyCard"




import {
  adaptSpacemonkeyDashboard,
} from "../../services/spacemonkeyDashboardAdapter"





const API_URL =
  "http://localhost:3001/api"







function SpacemonkeyDashboard(){


  const [
    dashboard,
    setDashboard
  ] = useState(null)



  const [
    loading,
    setLoading
  ] = useState(true)







  async function loadDashboard(){


    try{


      const response =

        await fetch(

          `${API_URL}/spacemonkey/dashboard`

        )



      const data =

        await response.json()



      const adapted =

        adaptSpacemonkeyDashboard(

          data

        )



      setDashboard({

        ...adapted,


        runtimeState:

          data.runtimeState,


        cognitiveState:

          data.cognitiveState

      })


    }


    catch(error){


      console.error(

        "Spacemonkey dashboard error",

        error

      )


      setDashboard(null)


    }


    finally{


      setLoading(false)


    }


  }







  useEffect(()=>{


    loadDashboard()



    const interval =

      setInterval(

        loadDashboard,

        5000

      )



    return ()=>{


      clearInterval(

        interval

      )


    }


  },[])







  if(loading){


    return (

      <div
        className="
          rounded-2xl
          border
          border-neutral-800
          bg-neutral-900
          p-5
          text-neutral-400
        "
      >

        Loading Spacemonkey...

      </div>

    )

  }







  if(!dashboard){


    return (

      <div
        className="
          rounded-2xl
          border
          border-red-900
          bg-neutral-900
          p-5
          text-red-400
        "
      >

        Spacemonkey offline

      </div>

    )

  }







  return (

    <div className="space-y-4">


      <SpacemonkeyIdentity />



      <SpacemonkeySystemCard

        system={
          dashboard.system
        }

      />



      <SpacemonkeyRuntimeCard

        runtimeActivity={
          dashboard.runtimeActivity
        }

      />



      <SpacemonkeyCognitiveStateCard

        cognitiveState={
          dashboard.cognitiveState
        }

      />



      <SpacemonkeyContextCard />



      <SpacemonkeyNextStep

        planning={
          dashboard.planning
        }

      />



      <SpacemonkeyDecisionCard

        decision={
          dashboard.decision
        }

      />



      <SpacemonkeyMemoryCard />



      <SpacemonkeySafetyCard />



      <SpacemonkeyPipeline

        activity={
          dashboard.activity
        }

      />


    </div>

  )

}







export default SpacemonkeyDashboard