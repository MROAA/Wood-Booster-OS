import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
} from "../api/client"




const HEALTHY_VALUES =
  new Set([
    "active",
    "healthy",
    "protected",
    "available",
    "ok",
    "online",
    "operational",
    "created",
    true,
  ])


const UNHEALTHY_VALUES =
  new Set([
    "down",
    "error",
    "unavailable",
    "offline",
    "failed",
    false,
  ])




function Spacemonkey(){


  const [
    data,
    setData,
  ] = useState(null)



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState(null)




  async function loadData(){


    try{


      const [
        identity,
        safety,
        system,
        catalog,
        snapshot,
        modules,
        runtime,
        capabilities,
        reflection,
      ] =
      await Promise.all([

        apiGet(
          "/spacemonkey/identity"
        ),


        apiGet(
          "/spacemonkey/safety"
        ),


        apiGet(
          "/spacemonkey/system"
        ),


        apiGet(
          "/spacemonkey/api-catalog"
        ),


        apiGet(
          "/spacemonkey/snapshot-v3"
        ),


        apiGet(
          "/spacemonkey/modules"
        ),


        apiGet(
          "/spacemonkey/runtime"
        ),


        apiGet(
          "/spacemonkey/capabilities"
        ),

        apiGet(
          "/spacemonkey/reflection"
        ),

      ])





      setData({

        identity,

        safety,

        system,

        catalog,

        snapshot,

        modules,

        runtime,

        capabilities,

        reflection,

      })


    }
    catch(loadError){


      setError(
        loadError.message
      )


    }
    finally{


      setLoading(false)


    }


  }


  useEffect(()=>{


    loadData()


  },[])




  if(loading){


    return (

      <div className="panel p-6">

        Loading Spacemonkey...

      </div>

    )

  }




  if(error){


    return (

      <div className="panel text-red-400">

        Spacemonkey error:
        {" "}
        {error}

      </div>

    )

  }




  const identityStatus =
    data.identity?.data?.status


  const identity =
    data.identity?.data?.identity
    ||
    {
      name:"Unknown",
      creator:"Unknown"
    }




  const system =
    data.system?.snapshot
    ||
    {
      core:{
        status:"unknown"
      },
      modules:[]
    }




  const safety =
    data.safety?.data
    ||
    {
      status: "unknown",
      snapshots:{
        count:0
      },
      recovery:{
        available:false
      }
    }




  const catalog =
    data.catalog?.catalog
    ||
    {
      apis:[]
    }




  const modules =
    data.modules?.modules
    ||
    []




  const runtime =
    data.runtime?.runtime
    ||
    {
      environment:{},
      system:{}
    }


  const runtimeHealthy =
    data.runtime?.health?.healthy




  const capabilities =
    data.capabilities?.capabilities
    ||
    {
      total:0,
      available:0,
      capabilities:[]
    }


  const snapshotStatus =
    data.snapshot?.snapshot?.manifest?.status




  return (

    <div className="space-y-8">


      <header>

        <h1 className="page-title">
          ⬡ Spacemonkey
        </h1>


        <p className="page-description">
          Wood-Booster HQ:n AI-operaattori
          ja järjestelmän valvoja.
        </p>


      </header>




      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">


        <Card title="Identity">

          <p>
            Name:
            {" "}
            {identity.name}
          </p>


          <p>
            Creator:
            {" "}
            {identity.creator}
          </p>


          <StatusBadge
            value={identityStatus}
          />

        </Card>




        <Card title="Kernel">

          <p>
            Core:
            {" "}
            {system.core.status}
          </p>


          <p>
            Modules:
            {" "}
            {system.modules.length}
          </p>


          <StatusBadge
            value={system.core.status}
          />

        </Card>




        <Card title="Safety">

          <p>
            Snapshots:
            {" "}
            {safety.snapshots.count}
          </p>


          <p>
            Recovery:
            {" "}
            {
              safety.recovery.available
                ?
                "AVAILABLE"
                :
                "OFF"
            }
          </p>


          <StatusBadge
            value={safety.status}
            icon="▩"
          />

        </Card>


      </div>




      <Card title="API Gateway">

        {
          catalog.apis.map(
            api=>(

              <div
                key={api.id}
                className="border-b border-[var(--wood-border)] pb-2 mb-3"
              >

                <p className="font-bold">
                  {api.id}
                </p>


                <p className="text-[var(--wood-muted)]">
                  {api.path}
                </p>


                <StatusBadge
                  value={api.status}
                />

              </div>

            )
          )
        }

      </Card>




      <Card title="Modules">

        {
          modules.map(
            module=>(

              <div
                key={module.id}
                className="border-b border-[var(--wood-border)] pb-2 mb-3"
              >

                <p className="font-bold">
                  {module.name}
                </p>


                <p className="text-[var(--wood-muted)]">
                  Version:
                  {" "}
                  {module.version}
                </p>


                <StatusBadge
                  value={module.health}
                />

              </div>

            )
          )
        }

      </Card>




      <Card title="Runtime Awareness">

        <p>
          Platform:
          {" "}
          {runtime.environment.platform}
        </p>


        <p>
          Node:
          {" "}
          {runtime.environment.nodeVersion}
        </p>


        <p>
          System:
          {" "}
          {runtime.system.state}
        </p>


        <p>
          Awareness:
          {" "}
          {runtime.system.awareness}
        </p>


        <StatusBadge
          value={runtimeHealthy}
        />

      </Card>




      <Card title="Capability Health">


        <p>
          Available:
          {" "}
          {capabilities.available}
          /
          {capabilities.total}
        </p>



        {
          capabilities.capabilities.map(
            capability=>(

              <div
                key={capability.id}
                className="border-b border-[var(--wood-border)] pb-2"
              >

                <p>
                  {capability.name}
                </p>


                <StatusBadge
                  value={capability.status}
                />

              </div>

            )
          )
        }


      </Card>


      <Card title="⬢ Reflection Intelligence">


        <p>

          State:
          {" "}
          {data.reflection?.reflection?.state
            ||
            "unknown"}

        </p>


        <p>

          Focus:
          {" "}
          {data.reflection?.reflection?.currentFocus
            ||
            "No reflection data"}

        </p>


        <p>

          Decisions:
          {" "}
          {data.reflection?.reflection?.decisions
            ||
            0}

        </p>


        <p>

          Health:
          {" "}
          {data.reflection?.reflection?.health?.status
            ||
            data.reflection?.health?.status
            ||
            "unknown"}

        </p>



        <div className="mt-4">


          <p className="font-bold">

            Improvements:

          </p>



          {
            data.reflection?.reflection?.improvements?.map(

              improvement => (

                <p
                  key={improvement}
                  className="text-[var(--wood-muted)]"
                >

                  • {improvement}

                </p>

              )

            )
          }


        </div>


      </Card>


      <Card title="Snapshot">

        <p>
          Version:
          {" "}
          {data.snapshot.version}
        </p>


        <StatusBadge
          value={snapshotStatus}
        />

      </Card>


    </div>

  )

}




function Card({
  title,
  children,
}){


  return (

    <section className="card p-6">

      <h2 className="mb-4 text-xl font-bold">
        {title}
      </h2>


      <div className="space-y-2 text-[var(--wood-text)]">

        {children}

      </div>


    </section>

  )

}




function StatusBadge({
  value,
  icon,
}){


  const normalized =
    typeof value === "string"
    ?
    value.toLowerCase()
    :
    value


  const isHealthy =
    HEALTHY_VALUES.has(
      normalized
    )


  const isUnhealthy =
    UNHEALTHY_VALUES.has(
      normalized
    )


  const colorClass =
    isHealthy
    ?
    "text-green-400"
    :
    isUnhealthy
    ?
    "text-red-400"
    :
    "text-[var(--wood-muted)]"


  const label =
    value === undefined ||
    value === null ||
    value === ""
    ?
    "UNKNOWN"
    :
    String(value).toUpperCase()


  const displayIcon =
    icon
    ||
    (
      isHealthy
      ?
      "●"
      :
      isUnhealthy
      ?
      "◆"
      :
      "○"
    )


  return (

    <p className={colorClass}>

      {displayIcon}
      {" "}
      {label}

    </p>

  )

}




export default Spacemonkey
