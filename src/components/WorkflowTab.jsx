import {
  useEffect,
  useState,
} from "react"

import {
  getWorkflow,
  saveWorkflow,
  getProgress,
} from "../data/WorkflowStore"



function WorkflowTab({
  projectId,
}) {


  const [
    workflow,
    setWorkflow,
  ] = useState([])





  useEffect(() => {

    setWorkflow(
      getWorkflow(
        projectId
      )
    )

  },[
    projectId,
  ])







  function updateWorkflow(
    updated
  ) {

    setWorkflow(
      updated
    )

    saveWorkflow(
      projectId,
      updated
    )

  }







  function toggleStep(
    stepId
  ) {

    const updated =
      workflow.map(
        step => {

          if(
            step.id !== stepId
          ) {

            return step

          }


          return {

            ...step,

            done:
              !step.done,

          }

        }
      )


    updateWorkflow(
      updated
    )

  }







  function addStep() {

    const title =
      window.prompt(
        "Uuden työvaiheen nimi"
      )


    if(
      !title?.trim()
    ) {

      return

    }


    updateWorkflow([

      ...workflow,

      {
        id:
          crypto.randomUUID(),

        title:
          title.trim(),

        done:
          false,
      },

    ])

  }







  function deleteStep(
    stepId
  ) {

    const updated =
      workflow.filter(
        step =>
          step.id !== stepId
      )


    updateWorkflow(
      updated
    )

  }







  const progress =
    getProgress(
      workflow
    )







  return (

    <div
      className="
        space-y-6
      "
    >


      <section
        className="
          panel
          p-6
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-wider
            text-[var(--wood-muted)]
          "
        >
          Workflow
        </p>


        <h2
          className="
            mt-2
            text-2xl
            font-semibold
          "
        >
          Projektin työnkulku
        </h2>


        <p
          className="
            mt-2
            text-[var(--wood-muted)]
          "
        >
          Seuraa projektin etenemistä vaihe vaiheelta.
        </p>




        <div
          className="
            mt-6
            h-3
            overflow-hidden
            rounded-full
            bg-neutral-800
          "
        >

          <div

            className="
              h-full
              bg-amber-500
              transition-all
            "

            style={{
              width:
                `${progress}%`,
            }}

          />

        </div>


        <p
          className="
            mt-3
            text-sm
            text-[var(--wood-muted)]
          "
        >

          Valmis:
          {" "}
          {progress} %

        </p>




        <button

          type="button"

          onClick={
            addStep
          }

          className="
            mt-6
            wb-button
          "

        >

          + Lisää työvaihe

        </button>


      </section>







      <section
        className="
          space-y-3
        "
      >

        {
          workflow.map(
            step => (

              <article

                key={
                  step.id
                }

                className="
                  card
                  flex
                  items-center
                  justify-between
                  gap-4
                  p-5
                "

              >

                <button

                  type="button"

                  onClick={() =>
                    toggleStep(
                      step.id
                    )
                  }

                  className="
                    flex
                    items-center
                    gap-3
                  "

                >

                  <span>

                    {
                      step.done
                      ?
                      "✅"
                      :
                      "⬜"
                    }

                  </span>


                  <span
                    className={
                      step.done
                      ?
                      "line-through text-neutral-500"
                      :
                      ""
                    }
                  >

                    {step.title}

                  </span>


                </button>





                <button

                  type="button"

                  onClick={() =>
                    deleteStep(
                      step.id
                    )
                  }

                  className="
                    text-sm
                    text-red-400
                  "

                >

                  Poista

                </button>


              </article>

            )

          )

        }


      </section>


    </div>

  )

}



export default WorkflowTab
