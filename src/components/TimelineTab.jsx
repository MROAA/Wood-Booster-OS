import {
  useEffect,
  useState,
} from "react"



const STORAGE_KEY =
  "woodBoosterProjects"





function TimelineTab({
  projectId,
  onProjectUpdated,
}) {


  const [
    tasks,
    setTasks,
  ] = useState([])



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


    const projects =
      readProjects()



    const project =
      projects.find(
        item =>
          String(item.id)
          ===
          String(projectId)
      )



    const savedTasks =
      Array.isArray(
        project?.timeline
      )

      ?

      project.timeline

      :

      []



    setTasks(
      savedTasks.map(
        normalizeTask
      )
    )


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







  function saveTasks(
    updatedTasks
  ) {


    const normalizedTasks =
      updatedTasks.map(
        normalizeTask
      )



    setTasks(
      normalizedTasks
    )



    const projects =
      readProjects()



    const updatedProjects =
      projects.map(
        project => {


          if(
            String(project.id)
            !==
            String(projectId)
          ) {

            return project

          }



          return {

            ...project,

            timeline:
              normalizedTasks,

            updatedAt:
              new Date().toISOString(),

          }


        }
      )



    localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(
        updatedProjects
      )

    )



    const updatedProject =
      updatedProjects.find(
        project =>
          String(project.id)
          ===
          String(projectId)
      )



    onProjectUpdated?.(
      updatedProject,
      updatedProjects
    )


  }







  function addTask(
    event
  ) {


    event.preventDefault()



    const name =
      taskForm.name.trim()



    if(!name) {

      return

    }



    const newTask = {

      id:
        createId(),

      name,

      deadline:
        taskForm.deadline,

      completed:
        false,

      createdAt:
        new Date().toISOString(),

    }



    saveTasks([

      ...tasks,

      newTask,

    ])





    setTaskForm({

      name:
        "",

      deadline:
        "",

    })


  }







  function toggleTask(
    taskId
  ) {


    const updatedTasks =
      tasks.map(
        task => {


          if(
            task.id !== taskId
          ) {

            return task

          }



          return {

            ...task,

            completed:
              !task.completed,

          }


        }
      )



    saveTasks(
      updatedTasks
    )


  }







  function deleteTask(
    taskId
  ) {


    const shouldDelete =
      window.confirm(
        "Poistetaanko tämä työvaihe?"
      )



    if(!shouldDelete) {

      return

    }



    saveTasks(

      tasks.filter(
        task =>
          task.id !== taskId
      )

    )


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
                📅
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







function normalizeTask(
  task
) {

  if(
    typeof task === "string"
  ) {

    return {

      id:
        createId(),

      name:
        task,

      deadline:
        "",

      completed:
        false,

      createdAt:
        new Date().toISOString(),

    }

  }



  if(
    !task ||
    typeof task !== "object"
  ) {

    return {

      id:
        createId(),

      name:
        "Nimetön työvaihe",

      deadline:
        "",

      completed:
        false,

      createdAt:
        new Date().toISOString(),

    }

  }





  let name =
    "Nimetön työvaihe"



  if(
    typeof task.name === "string"
  ) {

    name =
      task.name

  }

  else if(
    typeof task.text === "string"
  ) {

    name =
      task.text

  }





  return {

    id:
      task.id ||
      createId(),

    name,

    deadline:
      typeof task.deadline === "string"
      ?
      task.deadline
      :
      "",

    completed:
      Boolean(
        task.completed
      ),

    createdAt:
      task.createdAt ||
      new Date().toISOString(),

  }

}







function readProjects() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      )



    const projects =
      saved
      ?
      JSON.parse(saved)
      :
      []



    return Array.isArray(projects)
      ?
      projects
      :
      []


  }

  catch {

    return []

  }

}







function createId() {

  if(
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {

    return crypto.randomUUID()

  }


  return (
    Date.now()
    +
    "-"
    +
    Math.random()
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
