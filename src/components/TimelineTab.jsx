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



function TimelineTab({
  projectId,
}) {


  const [
    tasks,
    setTasks,
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
    taskForm,
    setTaskForm,
  ] = useState({

    name:
      "",

    deadline:
      "",

  })





  useEffect(() => {

    if(!projectId) {

      return

    }


    let cancelled = false


    setLoading(true)


    apiGet(`/projects/${projectId}/timeline`)
      .then(data => {

        if(cancelled) {

          return

        }


        setTasks(
          data.tasks || []
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




  function handleChange(
    event
  ) {


    const {
      name,
      value,
    } =
      event.target



    setTaskForm(
      current => ({

        ...current,

        [name]:
          value,

      })
    )


  }




  async function addTask(
    event
  ) {


    event.preventDefault()



    const name =
      taskForm.name.trim()



    if(!name) {

      return

    }



    try {

      const data =
        await apiPost(
          `/projects/${projectId}/timeline`,
          {

            name,

            deadline:
              taskForm.deadline || null,

          }
        )


      setTasks(
        current => [
          ...current,
          data.task,
        ]
      )


      setTaskForm({

        name:
          "",

        deadline:
          "",

      })

    } catch(addError) {

      console.error(
        "Työvaiheen lisääminen epäonnistui:",
        addError,
      )


      setError(
        addError.message
      )

    }


  }




  async function toggleTask(
    taskId
  ) {


    const task =
      tasks.find(
        item =>
          item.id === taskId
      )


    if(!task) {

      return

    }


    try {

      const data =
        await apiPut(
          `/projects/${projectId}/timeline/${taskId}`,
          {

            completed:
              !task.completed,

          }
        )


      setTasks(
        current =>
          current.map(
            item =>
              item.id === taskId
              ?
              data.task
              :
              item
          )
      )

    } catch(toggleError) {

      console.error(
        "Työvaiheen päivittäminen epäonnistui:",
        toggleError,
      )


      setError(
        toggleError.message
      )

    }


  }




  async function deleteTask(
    taskId
  ) {


    const shouldDelete =
      window.confirm(
        "Poistetaanko tämä työvaihe?"
      )



    if(!shouldDelete) {

      return

    }



    try {

      await apiDelete(
        `/projects/${projectId}/timeline/${taskId}`
      )


      setTasks(
        current =>
          current.filter(
            task =>
              task.id !== taskId
          )
      )

    } catch(deleteError) {

      console.error(
        "Työvaiheen poistaminen epäonnistui:",
        deleteError,
      )


      setError(
        deleteError.message
      )

    }


  }




  const completedCount =
    tasks.filter(
      task =>
        task.completed
    )
    .length






  const progress =
    tasks.length === 0

    ?

    0

    :

    Math.round(
      (
        completedCount /
        tasks.length
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
          Timeline
        </p>


        <h2
          className="
            mt-2
            text-2xl
            font-semibold
          "
        >
          Projektin työvaiheet
        </h2>


        <p
          className="
            mt-2
            text-[var(--wood-muted)]
          "
        >
          Lisää projektin vaiheet ja seuraa etenemistä.
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

          {completedCount}
          {" / "}
          {tasks.length}
          {" "}
          valmiina —
          {" "}
          {progress}
          %

        </p>





        <form

          onSubmit={
            addTask
          }

          className="
            mt-6
            grid
            gap-4
            md:grid-cols-[1fr_220px_auto]
          "

        >

          <label>

            <span
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >
              Työvaihe
            </span>


            <input

              type="text"

              name="name"

              value={
                taskForm.name
              }

              onChange={
                handleChange
              }

              placeholder="Esimerkiksi puun oikaisu"

              className="
                wb-input
              "

              required

            />

          </label>





          <label>

            <span
              className="
                text-sm
                text-[var(--wood-muted)]
              "
            >
              Tavoitepäivä
            </span>


            <input

              type="date"

              name="deadline"

              value={
                taskForm.deadline
              }

              onChange={
                handleChange
              }

              className="
                wb-input
              "

            />


          </label>





          <button

            type="submit"

            className="
              wb-button
              self-end
            "

          >

            + Lisää vaihe

          </button>


        </form>


      </section>






      <section
        className="
          space-y-4
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

          tasks.length === 0

          ?

          (

            <div
              className="
                panel
                p-12
                text-center
              "
            >

              <p
                className="
                  text-5xl
                "
              >
                ■
              </p>


              <h3
                className="
                  mt-5
                  text-xl
                  font-semibold
                "
              >
                Ei työvaiheita vielä
              </h3>


              <p
                className="
                  mt-2
                  text-[var(--wood-muted)]
                "
              >
                Lisää ensimmäinen työvaihe yllä.
              </p>


            </div>

          )


          :

          (

            <div
              className="
                space-y-3
              "
            >

              {
                tasks.map(
                  (
                    task,
                    index
                  ) => (

                    <article

                      key={
                        task.id
                      }

                      className="
                        card
                        flex
                        flex-col
                        gap-4
                        p-5
                        sm:flex-row
                        sm:items-center
                      "

                    >

                      <button

                        type="button"

                        onClick={() =>
                          toggleTask(
                            task.id
                          )
                        }

                        className={`

                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          border
                          font-bold

                          ${
                            task.completed

                            ?

                            "border-green-500 bg-green-500 text-black"

                            :

                            "border-[var(--wood-border)] text-transparent hover:border-[var(--wood-accent)]"

                          }

                        `}

                      >

                        ✓

                      </button>





                      <div
                        className="
                          min-w-0
                          flex-1
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

                          Vaihe {index + 1}

                        </p>


                        <p

                          className={`

                            mt-1
                            font-medium

                            ${
                              task.completed

                              ?

                              "text-[var(--wood-muted)] line-through"

                              :

                              "text-[var(--wood-text)]"

                            }

                          `}

                        >

                          {task.name}

                        </p>





                        {
                          task.deadline && (

                            <p
                              className="
                                mt-2
                                text-sm
                                text-[var(--wood-muted)]
                              "
                            >

                              Tavoite:
                              {" "}
                              {
                                formatDate(
                                  task.deadline
                                )
                              }

                            </p>

                          )
                        }


                      </div>





                      <button

                        type="button"

                        onClick={() =>
                          deleteTask(
                            task.id
                          )
                        }

                        className="
                          rounded-lg
                          px-3
                          py-2
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


            </div>

          )

        }


      </section>


    </div>

  )

}







function formatDate(
  dateValue
) {

  const date =
    new Date(
      `${dateValue}T12:00:00`
    )



  if(
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateValue

  }



  return new Intl.DateTimeFormat(
    "fi-FI"
  )
  .format(date)

}



export default TimelineTab
