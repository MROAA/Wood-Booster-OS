import {
  useEffect,
  useState
} from "react"


import StatusGlow from "../components/systemPulse/StatusGlow"

import EnvironmentCard from "../components/systemPulse/EnvironmentCard"

import GitSyncCard from "../components/systemPulse/GitSyncCard"

import HardwareCard from "../components/systemPulse/HardwareCard"

import RuntimeCard from "../components/systemPulse/RuntimeCard"

import GitHistoryCard from "../components/systemPulse/GitHistoryCard"

import IdentityCard from "../components/systemPulse/IdentityCard"

import MonitorCard from "../components/systemPulse/MonitorCard"

import ActivityTimelineCard from "../components/systemPulse/ActivityTimelineCard"





function SystemPulse() {


  const [
    pulse,
    setPulse
  ] = useState(null)



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
    lastUpdate,
    setLastUpdate
  ] = useState(null)





  async function loadSystemData(){

    try {


      const pulseResponse =
        await fetch(
          "http://localhost:3001/api/system-pulse"
        )


      const pulseData =
        await pulseResponse.json()



      if(
        pulseData.success
      ){

        const summary =
          pulseData.pulse.summary



        setPulse({

          ...pulseData.pulse,


          brain: {

            modules:
              summary.modules.total,


            activeModules:
              summary.modules.active,

          },


          security: {

            capabilitiesApproved:
              summary.capability.approved,


            blocked:
              summary.security.blockedEvents,


            approvalRequired:
              summary.security.approvalRequired,


            status:
              summary.security.status,


            message:
              summary.security.message,

          },


          runtime:
            summary.runtime,

        })

      }





      const coreResponse =
        await fetch(
          "http://localhost:3001/api/spacemonkey/core"
        )


      const coreData =
        await coreResponse.json()



      if(
        coreData.success
      ){

        setCore(
          coreData.data
        )

      }





      const activityResponse =
        await fetch(
          "http://localhost:3001/api/spacemonkey/activity"
        )


      const activityData =
        await activityResponse.json()



      if(
        activityData.success
      ){

        setActivities(
          activityData.data.slice(
            0,
            10
          )
        )

      }





      setConnection(
        "ONLINE"
      )


      setLastUpdate(
        new Date()
      )


    }
    catch(error){

      console.error(
        error
      )


      setConnection(
        "OFFLINE"
      )

    }

  }





  useEffect(()=>{


    loadSystemData()


    const interval =
      setInterval(
        loadSystemData,
        10000
      )


    return () =>
      clearInterval(
        interval
      )


  },[])







  const brainHealthy =
    pulse?.brain?.modules > 0 &&
    pulse?.brain?.modules === pulse?.brain?.activeModules





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
          System Pulse
        </h1>


        <p
          className="
            mt-2
            text-sm
            text-[var(--wood-muted)]
          "
        >
          Wood-Booster OS järjestelmän tila
        </p>


      </header>





      <section
        className="
          grid
          grid-cols-2
          gap-6
        "
      >

        <div
          className="
            card
            p-6
            wood-hover
          "
        >

          <h2>
            Status
          </h2>


          <div
            className="
              mt-5
              space-y-3
            "
          >

            <StatusGlow
              label="System"
              value={
                pulse?.status
                ||
                "-"
              }
              status={
                pulse?.status === "healthy"
                  ?
                  "healthy"
                  :
                  "error"
              }
            />



            <StatusGlow
              label="AI Brain"
              value={`
                ${
                  pulse?.brain?.activeModules
                  ||
                  0
                }
                /
                ${
                  pulse?.brain?.modules
                  ||
                  0
                }
              `}
              status={
                brainHealthy
                  ?
                  "healthy"
                  :
                  "warning"
              }
            />



            <StatusGlow
              label="Security"
              value={`
                ${
                  pulse?.security?.capabilitiesApproved
                  ||
                  0
                }
                approved /
                ${
                  pulse?.security?.blocked
                  ||
                  0
                }
                blocked
              `}
              status={
                pulse?.security?.status === "warning"
                  ?
                  "warning"
                  :
                  "healthy"
              }
            />

          </div>


        </div>


      </section>





      <EnvironmentCard
        pulse={pulse}
      />





      <GitSyncCard
        pulse={pulse}
      />





      <HardwareCard
        pulse={pulse}
      />





      <RuntimeCard
        pulse={pulse}
      />





      <GitHistoryCard
        pulse={pulse}
      />





      <IdentityCard
        core={core}
      />





      <MonitorCard
        connection={connection}
        lastUpdate={lastUpdate}
      />





      <ActivityTimelineCard
        activities={activities}
      />



    </div>

  )

}



export default SystemPulse
