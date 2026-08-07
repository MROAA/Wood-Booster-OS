import {
  useEffect,
  useState
} from "react"


import {
  apiGet,
} from "../api/client"


import PulseCard from "../components/systemPulse/PulseCard"

import StatusGlow from "../components/systemPulse/StatusGlow"

import EnvironmentCard from "../components/systemPulse/EnvironmentCard"

import GitSyncCard from "../components/systemPulse/GitSyncCard"

import HardwareCard from "../components/systemPulse/HardwareCard"

import RuntimeCard from "../components/systemPulse/RuntimeCard"

import GitHistoryCard from "../components/systemPulse/GitHistoryCard"

import IdentityCard from "../components/systemPulse/IdentityCard"

import SecurityCard from "../components/systemPulse/SecurityCard"

import MonitorCard from "../components/systemPulse/MonitorCard"

import HealthScoreCard from "../components/systemPulse/HealthScoreCard"

import ActivityTimelineCard from "../components/systemPulse/ActivityTimelineCard"

import SnapshotCard from "../components/systemPulse/SnapshotCard"





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



  const [
    ,
    setPreviousHealth
  ] = useState(null)



  const [
    healthChange,
    setHealthChange
  ] = useState(null)



  const [
    loading,
    setLoading
  ] = useState(true)



  const [
    error,
    setError
  ] = useState("")





  async function loadSystemData(){

    try {

      setError("")


      const pulseData =
        await apiGet(
          "/system-pulse"
        )



      if(
        pulseData.success
      ){

        const summary =
          pulseData.pulse.summary



        const currentHealth =
          summary.healthScore



        setPreviousHealth(
          prevHealth => {

            if(
              prevHealth
            ){

              setHealthChange({

                from:
                  prevHealth.score,


                to:
                  currentHealth.score,


                difference:
                  currentHealth.score -
                  prevHealth.score,

              })

            }


            return currentHealth

          }
        )



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


          environment:
            summary.environment,


          hardware:
            summary.hardware,


          gitSummary:
            summary.gitSummary,


          gitHistory:
            summary.gitHistory,


        })

      }





      const coreData =
        await apiGet(
          "/spacemonkey/core"
        )



      if(
        coreData.success
      ){

        setCore(
          coreData.data
        )

      }





      const activityData =
        await apiGet(
          "/spacemonkey/activity"
        )



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
    catch(loadError){

      console.error(
        loadError
      )


      setConnection(
        "OFFLINE"
      )


      setError(
        loadError.message ||
        "Järjestelmätilan lataaminen epäonnistui."
      )

    }
    finally {

      setLoading(false)

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

function getPulseStatus(status){

  if(status === "healthy"){
    return "healthy"
  }

  if(status === "degraded"){
    return "warning"
  }

  if(status === "warning"){
    return "warning"
  }

  if(status === "error"){
    return "error"
  }

  return "warning"

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

        <p
          className="
            text-sm
            font-semibold
            uppercase
            tracking-[0.25em]
            text-[var(--wood-accent)]
          "
        >
          Diagnostiikka
        </p>

        <h1
          className="
            mt-2
            text-4xl
            brand-font
            text-[var(--wood-text)]
          "
        >
          System Pulse
        </h1>


        <p
          className="
            mt-3
            max-w-2xl
            text-sm
            text-[var(--wood-muted)]
          "
        >
          Wood-Booster OS järjestelmän tila
        </p>


      </header>




      {
        error && (

          <div className="panel text-red-400">
            {error}
          </div>

        )
      }




      {
        loading && !pulse && (

          <div className="panel p-6">
            Ladataan järjestelmätilaa...
          </div>

        )
      }




      <section
        className="
          grid
          grid-cols-1
          gap-6
          lg:grid-cols-2
          xl:grid-cols-3
        "
      >

        <PulseCard
          title="Status"
        >

          <div
            className="
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
  getPulseStatus(
    pulse?.status
  )
}            />



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

          </div>


        </PulseCard>


        <EnvironmentCard
          pulse={pulse}
        />


        <GitSyncCard
          pulse={pulse}
        />


        <HardwareCard
          pulse={pulse}
        />


        <SecurityCard
          security={
            pulse?.security
          }
        />


        <RuntimeCard
          pulse={pulse}
        />


        <IdentityCard
          core={core}
        />


        <MonitorCard
          connection={connection}
          lastUpdate={lastUpdate}
          pulse={
            pulse?.summary
          }
          healthChange={
            healthChange
          }
        />


        <HealthScoreCard
          pulse={pulse?.summary}
        />


        <SnapshotCard />

      </section>




      <section
        className="
          grid
          grid-cols-1
          gap-6
          lg:grid-cols-2
        "
      >

        <ActivityTimelineCard
          activities={activities}
        />


        <GitHistoryCard
          pulse={pulse}
        />

      </section>


    </div>

  )

}



export default SystemPulse
