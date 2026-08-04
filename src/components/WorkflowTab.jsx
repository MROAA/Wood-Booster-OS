import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client"



function WorkflowTab({
  projectId,
}) {


  const [
    workflow,
    setWorkflow,
  ] = useState([])



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState("")



  const [
    newStepTitle,
    setNewStepTitle,
  ] = useState("")




  useEffect(() => {

    if(!projectId) {

      return

    }


    let cancelled = false


    setLoading(true)


    apiGet(`/projects/${projectId}/workflow`)
      .then(data => {

        if(cancelled) {

          return

        }


        setWorkflow(
          data.steps || []
        )

      })
      .catch(loadError => {

        if(cancelled) {

          return

        }


        setError(
          loadError.message
        )

      })
      .finally(() => {

        if(!cancelled) {

          setLoading(false)

        }

      })


    return () => {

      cancelled = true

    }

  },[
    projectId,
  ])




  async function toggleStep(
    stepId
  ) {


    const step =
      workflow.find(
        item =>
          item.id === stepId
      )


    if(!step) {

      return

    }


    try {

      const data =
        await apiPut(
          `/projects/${projectId}/workflow/${stepId}`,
          {

            done:
              !step.done,

          }
        )


      setWorkflow(
        current =>
          current.map(
            item =>
              item.id === stepId
              ?
              data.step
              :
              item
          )
      )

    } catch(toggleError) {

      console.error(
        "Vaiheen päivittäminen epäonnistui:",
        toggleError,
      )


      setError(
        toggleError.message
      )

    }


  }




  async function addStep(
    event
  ) {


    event.preventDefault()


    const title =
      newStepTitle.trim()


    if(!title) {

      return

    }


    try {

      const data =
        await apiPost(
          `/projects/${projectId}/workflow`,
          {

            title,

          }
        )


      setWorkflow(
        current => [
          ...current,
          data.step,
        ]
      )


      setNewStepTitle(
        ""
      )

    } catch(addError) {

      console.error(
        "Vaiheen lisääminen epäonnistui:",
        addError,
      )


      setError(
        addError.message
      )

    }


  }




  async function deleteStep(
    stepId
  ) {


    try {

      await apiDelete(
        `/projects/${projectId}/workflow/${stepId}`
      )


      setWorkflow(
        current =>
          current.filter(
            step =>
              step.id !== stepId
          )
      )

    } catch(deleteError) {

      console.error(
        "Vaiheen poistaminen epäonnistui:",
        deleteError,
      )


      setError(
        deleteError.message
      )

    }


  }




  const doneCount =
    workflow.filter(
      step =>
        step.done
    )
    .length



  const progress =
    workflow.length === 0

    ?

    0

    :

    Math.round(
      (
        doneCount /
        workflow.length
      )
      *
      100
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


        {
          error && (

            <div
              className="
                mt-5
                card
                border-red-900/60
                bg-red-950/30
                p-3
                text-sm
                text-red-300
              "
            >

              {error}

            </div>

          )
        }




        <div
          className="
            mt-6
            h-3
            overflow-hidden
            rounded-full
            bg-[var(--wood-bg)]
          "
        >

          <div

            className="
              h-full
              rounded-full
              bg-[var(--wood-accent)]
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
          {doneCount}
          {" / "}
          {workflow.length}
          {" "}
          —
          {" "}
          {progress} %

        </p>




        <form

          onSubmit={
            addStep
          }

          className="
            mt-6
            flex
            flex-col
            gap-3
            sm:flex-row
          "

        >

          <input

            type="text"

            value={
              newStepTitle
            }

            onChange={
              event =>
                setNewStepTitle(
                  event.target.value
                )
            }

            placeholder="Uuden työvaiheen nimi"

            className="
              wb-input
              flex-1
            "

          />


          <button

            type="submit"

            className="
              wb-button
            "

          >

            + Lisää työvaihe

          </button>


        </form>


      </section>






      <section
        className="
          space-y-3
        "
      >

        {
          loading

          ?

          (

            <div
              className="
                panel
                p-6
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Ladataan työvaiheita...

            </div>

          )

          :

          (

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
                        "line-through text-[var(--wood-muted)]"
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

          )

        }


      </section>


    </div>

  )

}



export default WorkflowTab
