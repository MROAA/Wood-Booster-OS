function TaskModule({
  tasks = []
}) {


  const defaultTasks = [

    {
      id: 1,
      name: "Develop Wood-Booster HQ",
      status: "ACTIVE",
      priority: "HIGH"
    },

    {
      id: 2,
      name: "Improve Spacemonkey",
      status: "PLANNED",
      priority: "MEDIUM"
    }

  ]



  const items =
    tasks.length
      ? tasks
      : defaultTasks





  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2
        className="
          text-sm
          uppercase
          tracking-widest
          text-[var(--wood-muted)]
        "
      >
        ▤ Tasks
      </h2>





      <div
        className="
          mt-5
          space-y-3
        "
      >

        {
          items.map(
            task => (

              <div
                key={task.id}
                className="
                  rounded-xl
                  bg-[var(--wood-panel)]
                  p-4
                "
              >

                <p
                  className="
                    text-sm
                  "
                >
                  {task.name}
                </p>


                <div
                  className="
                    mt-2
                    flex
                    justify-between
                    text-xs
                    text-[var(--wood-muted)]
                  "
                >

                  <span>
                    {task.status}
                  </span>


                  <span
                    className="
                      text-[var(--wood-accent)]
                    "
                  >
                    {task.priority}
                  </span>


                </div>


              </div>

            )
          )
        }

      </div>


    </section>

  )

}


export default TaskModule
