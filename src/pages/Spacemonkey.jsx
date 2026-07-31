import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





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

        fetch(
          `${API_URL}/spacemonkey/identity`
        )
        .then(
          r=>r.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/safety`
        )
        .then(
          r=>r.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/system`
        )
        .then(
          r=>r.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/api-catalog`
        )
        .then(
          r=>r.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/snapshot-v3`
        )
        .then(
          r=>r.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/modules`
        )
        .then(
          r=>r.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/runtime`
        )
        .then(
          r=>r.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/capabilities`
        )
        .then(
          r=>r.json()
        ),
fetch(
  `${API_URL}/spacemonkey/reflection`
)
.then(
  r=>r.json()
)
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


    loadData()


  },[])







  if(loading){


    return (

      <div className="text-neutral-400">

        Loading Spacemonkey...

      </div>

    )

  }







  if(error){


    return (

      <div className="text-red-400">

        Spacemonkey error:
        {" "}
        {error}

      </div>

    )

  }







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





  const capabilities =
    data.capabilities?.capabilities
    ||
    {
      total:0,
      available:0,
      capabilities:[]
    }







  return (

    <div className="space-y-8">


      <header>

        <p className="
          text-sm
          uppercase
          tracking-[0.3em]
          text-amber-500
        ">
          AI Operator
        </p>


        <h1 className="
          mt-2
          text-4xl
          font-bold
        ">
          🐒 Spacemonkey
        </h1>


        <p className="
          mt-3
          text-neutral-400
        ">
          Wood-Booster OS:n AI-operaattori
          ja järjestelmän valvoja.
        </p>


      </header>





      <div className="
        grid
        grid-cols-1
        gap-5
        md:grid-cols-3
      ">


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


          <p className="text-green-400">
            🟢 Active
          </p>

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


          <p className="text-green-400">
            🟢 Healthy
          </p>

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


          <p className="text-green-400">
            🛡 Protected
          </p>

        </Card>


      </div>





      <Card title="API Gateway">

        {
          catalog.apis.map(
            api=>(

              <div
                key={api.id}
                className="
                  border-b
                  border-neutral-800
                  pb-2
                  mb-3
                "
              >

                <p className="font-bold">
                  {api.id}
                </p>


                <p className="text-neutral-400">
                  {api.path}
                </p>


                <p className="text-green-400">
                  {api.status}
                </p>

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
                className="
                  border-b
                  border-neutral-800
                  pb-2
                  mb-3
                "
              >

                <p className="font-bold">
                  {module.name}
                </p>


                <p className="text-neutral-400">
                  Version:
                  {" "}
                  {module.version}
                </p>


                <p className="text-green-400">
                  🟢 {module.health}
                </p>

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


        <p className="text-green-400">
          🟢 Healthy
        </p>

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
                className="
                  border-b
                  border-neutral-800
                  pb-2
                "
              >

                <p>
                  {capability.name}
                </p>


                <p className="text-green-400">

                  🟢 {capability.status}

                </p>

              </div>

            )
          )
        }


      </Card>


      <Card title="🧠 Reflection Intelligence">


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
                  className="text-neutral-400"
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


        <p>
          Status:
          {" "}
          ACTIVE
        </p>

      </Card>


    </div>

  )

}







function Card({
  title,
  children,
}){


  return (

    <section
      className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-6
      "
    >

      <h2
        className="
          mb-4
          text-xl
          font-bold
        "
      >
        {title}
      </h2>


      <div
        className="
          space-y-2
          text-neutral-300
        "
      >

        {children}

      </div>


    </section>

  )

}







export default Spacemonkey
