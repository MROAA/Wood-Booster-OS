import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"



const pipelineSteps = [
  {
    name:"Code Generator",
    event:"code_generation_completed",
  },
  {
    name:"Change Approval",
    event:"approval_requested",
  },
  {
    name:"Validation Engine",
    event:"code_validation_completed",
  },
  {
    name:"Test Engine",
    event:"code_test_plan_created",
  },
  {
    name:"Execution Simulator",
    event:"code_execution_simulated",
  },
  {
    name:"Release Gate",
    event:"release_gate_evaluated",
  },
]



function SpacemonkeyPanel(){


  const [
    dashboard,
    setDashboard
  ] = useState(null)



  const [
    loading,
    setLoading
  ] = useState(true)





  useEffect(()=>{


    async function load(){


      try{


        const response =
          await fetch(
            `${API_URL}/spacemonkey/dashboard`
          )


        const data =
          await response.json()


        setDashboard(
          data.dashboard
        )


      }

      catch(error){

        console.error(
          "Spacemonkey error",
          error
        )

      }

      finally{

        setLoading(false)

      }


    }


    load()


  },[])





  if(loading){

    return (

      <div className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
        text-neutral-400
      ">

        Loading Spacemonkey...

      </div>

    )

  }





  if(!dashboard){

    return (

      <div className="
        rounded-2xl
        border
        border-red-900
        bg-neutral-900
        p-5
        text-red-400
      ">

        Spacemonkey offline

      </div>

    )

  }





  const activity =
    dashboard.activity || []



  const currentTask =
    dashboard.development?.currentTask || {}





  function hasEvent(event){

    return activity.some(
      item =>
        item.type === event
    )

  }





  const statistics =
    dashboard.statistics || {}





  return (

    <section className="
      space-y-5
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-5
      overflow-auto
    ">


      <header>

        <h2 className="
          text-2xl
          font-bold
          text-white
        ">

          🐒 Spacemonkey

        </h2>


        <p className="
          text-sm
          text-neutral-400
        ">

          AI Development Command Center

        </p>


      </header>





      <div className="
        grid
        grid-cols-2
        gap-3
      ">


        <div className="
          rounded-xl
          bg-neutral-800
          p-4
        ">

          <p className="text-xs text-neutral-400">
            System
          </p>


          <p className="mt-2 font-bold text-green-400">

            {dashboard.system.status}

          </p>


        </div>



        <div className="
          rounded-xl
          bg-neutral-800
          p-4
        ">

          <p className="text-xs text-neutral-400">
            Activity
          </p>


          <p className="mt-2 font-bold text-white">

            {activity.length}

          </p>


        </div>


      </div>






      <div className="
        rounded-xl
        bg-neutral-800
        p-4
      ">


        <h3 className="
          font-semibold
          text-white
        ">

          🎯 Current Development Task

        </h3>



        <div className="
          mt-3
          space-y-2
          text-sm
          text-neutral-300
        ">


          <p>

            Status:
            {" "}
            <span className="text-white">
              {currentTask.status || "unknown"}
            </span>

          </p>



          <p>

            File:
            {" "}
            <span className="text-white">
              {currentTask.file || "unknown"}
            </span>

          </p>



          <p>

            Quality:
            {" "}
            <span className="text-white">
              {currentTask.quality || "unknown"}
            </span>

          </p>



          <p>

            Release:
            {" "}
            <span className="text-white">
              {currentTask.release || "unknown"}
            </span>

          </p>



          <p>

            Last Module:
            {" "}
            <span className="text-white">
              {currentTask.lastModule || "unknown"}
            </span>

          </p>



          <p>

            Message:
            {" "}
            <span className="text-white">
              {currentTask.lastMessage || "unknown"}
            </span>

          </p>


        </div>


      </div>







      <div>

        <h3 className="
          mb-3
          font-semibold
          text-white
        ">

          🧩 Module Health

        </h3>


        <div className="space-y-2">


          {
            dashboard.modules.map(
              module => (

                <div
                  key={module.name}
                  className="
                    flex
                    justify-between
                    rounded-xl
                    bg-neutral-800
                    p-3
                  "
                >

                  <span className="text-white">

                    {module.name}

                  </span>


                  <span className="text-green-400">

                    {module.status}

                  </span>


                </div>

              )
            )
          }


        </div>


      </div>







      <div>

        <h3 className="
          mb-3
          font-semibold
          text-white
        ">

          🔄 Development Pipeline

        </h3>


        <div className="space-y-2">


          {
            pipelineSteps.map(
              step => (

                <div
                  key={step.event}
                  className="
                    flex
                    justify-between
                    rounded-xl
                    bg-neutral-800
                    p-3
                  "
                >

                  <span className="text-white">

                    {step.name}

                  </span>


                  <span className={
                    hasEvent(step.event)
                    ?
                    "text-green-400"
                    :
                    "text-neutral-500"
                  }>

                    {
                      hasEvent(step.event)
                      ?
                      "✓"
                      :
                      "○"
                    }

                  </span>


                </div>

              )
            )
          }


        </div>


      </div>







      <div>

        <h3 className="
          mb-3
          font-semibold
          text-white
        ">

          📊 Statistics

        </h3>


        <div className="
          rounded-xl
          bg-neutral-800
          p-4
          text-sm
          text-neutral-300
        ">

          <p>
            Activity: {statistics.activity || 0}
          </p>

          <p>
            Workflows: {statistics.workflows || 0}
          </p>

          <p>
            Audits: {statistics.audits || 0}
          </p>


        </div>


      </div>







      <div>

        <h3 className="
          mb-3
          font-semibold
          text-white
        ">

          📜 Activity Feed

        </h3>


        <div className="space-y-2">


          {
            activity
            .slice(0,8)
            .map(
              item => (

                <div
                  key={item.id}
                  className="
                    rounded-xl
                    bg-neutral-800
                    p-3
                  "
                >

                  <p className="text-white">

                    {item.module}

                  </p>


                  <p className="
                    text-xs
                    text-neutral-400
                  ">

                    {item.message}

                  </p>


                </div>

              )
            )
          }


        </div>


      </div>


    </section>

  )

}



export default SpacemonkeyPanel
