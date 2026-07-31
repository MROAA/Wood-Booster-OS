import { useEffect, useState } from "react"

function TimelineTab({ projectId, onProjectUpdated }) {
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({
    name: "",
    deadline: "",
  })

  useEffect(() => {
    const projects = readProjects()

    const project = projects.find(
      (item) => String(item.id) === String(projectId),
    )

    const savedTasks = Array.isArray(project?.timeline)
      ? project.timeline
      : []

    setTasks(savedTasks.map(normalizeTask))
  }, [projectId])

  function handleChange(event) {
    const { name, value } = event.target

    setTaskForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  function saveTasks(updatedTasks) {
    const normalizedTasks = updatedTasks.map(normalizeTask)

    setTasks(normalizedTasks)

    const projects = readProjects()

    const updatedProjects = projects.map((project) => {
      if (String(project.id) !== String(projectId)) {
        return project
      }

      return {
        ...project,
        timeline: normalizedTasks,
        updatedAt: new Date().toISOString(),
      }
    })

    localStorage.setItem(
      "woodBoosterProjects",
      JSON.stringify(updatedProjects),
    )

    const updatedProject = updatedProjects.find(
      (project) => String(project.id) === String(projectId),
    )

    onProjectUpdated?.(updatedProject, updatedProjects)
  }

  function addTask(event) {
    event.preventDefault()

    const name = taskForm.name.trim()

    if (!name) {
      return
    }

    const newTask = {
      id: createId(),
      name,
      deadline: taskForm.deadline,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    saveTasks([...tasks, newTask])

    setTaskForm({
      name: "",
      deadline: "",
    })
  }

  function toggleTask(taskId) {
    const updatedTasks = tasks.map((task) => {
      if (task.id !== taskId) {
        return task
      }

      return {
        ...task,
        completed: !task.completed,
      }
    })

    saveTasks(updatedTasks)
  }

  function deleteTask(taskId) {
    const shouldDelete = window.confirm(
      "Poistetaanko tämä työvaihe?",
    )

    if (!shouldDelete) {
      return
    }

    const updatedTasks = tasks.filter(
      (task) => task.id !== taskId,
    )

    saveTasks(updatedTasks)
  }

  const completedCount = tasks.filter(
    (task) => task.completed,
  ).length

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100)

  return (
    <div>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Timeline
        </p>

        <h3 className="mt-2 text-2xl font-semibold">
          Projektin työvaiheet
        </h3>

        <p className="mt-2 text-neutral-400">
          Lisää projektin työvaiheet ja merkitse ne valmiiksi.
        </p>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-neutral-500">
          {completedCount} / {tasks.length} valmiina — {progress} %
        </p>

        <form
          onSubmit={addTask}
          className="mt-6 grid gap-4 md:grid-cols-[1fr_220px_auto]"
        >
          <label>
            <span className="text-sm text-neutral-300">
              Työvaihe
            </span>

            <input
              type="text"
              name="name"
              value={taskForm.name}
              onChange={handleChange}
              placeholder="Esimerkiksi puun oikaisu"
              required
              className={inputClasses}
            />
          </label>

          <label>
            <span className="text-sm text-neutral-300">
              Tavoitepäivä
            </span>

            <input
              type="date"
              name="deadline"
              value={taskForm.deadline}
              onChange={handleChange}
              className={inputClasses}
            />
          </label>

          <button
            type="submit"
            className="self-end rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 hover:bg-amber-400"
          >
            + Lisää vaihe
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-700 p-10 text-center">
            <p className="text-5xl">📅</p>

            <h3 className="mt-5 text-xl font-semibold">
              Ei työvaiheita vielä
            </h3>

            <p className="mt-2 text-neutral-400">
              Lisää ensimmäinen työvaihe yllä olevalla lomakkeella.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <article
                key={task.id}
                className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:flex-row sm:items-center"
              >
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold ${
                    task.completed
                      ? "border-green-500 bg-green-500 text-neutral-950"
                      : "border-neutral-600 text-transparent hover:border-amber-500"
                  }`}
                >
                  ✓
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Vaihe {index + 1}
                  </p>

                  <p
                    className={`mt-1 font-medium ${
                      task.completed
                        ? "text-neutral-500 line-through"
                        : "text-neutral-200"
                    }`}
                  >
                    {task.name}
                  </p>

                  {task.deadline && (
                    <p className="mt-2 text-sm text-neutral-500">
                      Tavoite: {formatDate(task.deadline)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  Poista
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function normalizeTask(task) {
  if (typeof task === "string") {
    return {
      id: createId(),
      name: task,
      deadline: "",
      completed: false,
      createdAt: new Date().toISOString(),
    }
  }

  if (!task || typeof task !== "object") {
    return {
      id: createId(),
      name: "Nimetön työvaihe",
      deadline: "",
      completed: false,
      createdAt: new Date().toISOString(),
    }
  }

  let name = ""

  if (typeof task.name === "string") {
    name = task.name
  } else if (typeof task.text === "string") {
    name = task.text
  } else if (
    task.name &&
    typeof task.name === "object" &&
    typeof task.name.text === "string"
  ) {
    name = task.name.text
  } else {
    name = "Nimetön työvaihe"
  }

  return {
    id: task.id || createId(),
    name,
    deadline:
      typeof task.deadline === "string"
        ? task.deadline
        : "",
    completed: Boolean(task.completed),
    createdAt:
      typeof task.createdAt === "string"
        ? task.createdAt
        : new Date().toISOString(),
  }
}

function readProjects() {
  try {
    const savedProjects = localStorage.getItem(
      "woodBoosterProjects",
    )

    const projects = savedProjects
      ? JSON.parse(savedProjects)
      : []

    return Array.isArray(projects) ? projects : []
  } catch {
    return []
  }
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return new Intl.DateTimeFormat("fi-FI").format(date)
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-500"

export default TimelineTab
