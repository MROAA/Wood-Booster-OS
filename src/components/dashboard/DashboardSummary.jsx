import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  Link,
} from "react-router-dom"

import {
  apiGet,
  apiPut,
} from "../../api/client"



function formatDate(value) {

  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("fi-FI").format(date)

}



function StatBlock({ label, value }) {

  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  )

}



function DashboardSummary() {

  const [summary, setSummary] = useState(null)
  const [todayTasks, setTodayTasks] = useState([])
  const [reminders, setReminders] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [savingStepId, setSavingStepId] = useState(null)

  const cancelledRef = useRef(false)


  async function load() {

    setLoading(true)
    setError("")

    try {

      const [dashboardData, remindersData] = await Promise.all([
        apiGet("/dashboard"),
        apiGet("/reminders"),
      ])

      if (cancelledRef.current) {
        return
      }

      setSummary(dashboardData.summary)
      setTodayTasks(dashboardData.todayTasks || [])
      setReminders(remindersData.reminders || [])

    }
    catch (loadError) {

      console.error(
        "Dashboard summary error:",
        loadError,
      )

      if (!cancelledRef.current) {
        setError(
          loadError.message ||
            "Yhteenvedon lataaminen epäonnistui.",
        )
      }

    }
    finally {

      if (!cancelledRef.current) {
        setLoading(false)
      }

    }

  }


  useEffect(() => {

    cancelledRef.current = false

    load()

    return () => {
      cancelledRef.current = true
    }

  }, [])


  async function markStepDone(projectId, stepId) {

    try {

      await apiPut(
        `/projects/${projectId}/workflow/${stepId}`,
        { done: true },
      )

      await load()

    }
    catch (updateError) {

      console.error(
        "Työvaiheen merkitseminen valmiiksi epäonnistui:",
        updateError,
      )

      setError(
        updateError.message ||
          "Työvaiheen päivittäminen epäonnistui.",
      )

    }

  }


  if (loading) {
    return (
      <section className="card p-6">
        <p className="text-[var(--wood-muted)]">
          Ladataan tilannekuvaa...
        </p>
      </section>
    )
  }


  if (error) {
    return (
      <section className="card border-red-900/60 bg-red-950/30 p-6 text-red-300">
        {error}
      </section>
    )
  }


  const visibleReminders = reminders.slice(0, 5)

  async function handleMarkDone(task) {

    setSavingStepId(task.stepId)

    await markStepDone(task.projectId, task.stepId)

    setSavingStepId(null)

  }


  return (
    <section className="space-y-4">

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

        <StatBlock
          label="Aktiiviset projektit"
          value={summary?.activeProjects ?? 0}
        />

        <StatBlock
          label="Asiakkaat"
          value={summary?.totalCustomers ?? 0}
        />

        <StatBlock
          label="Valmiit projektit"
          value={summary?.completedProjects ?? 0}
        />

      </div>


      <div className="card p-4">

        <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
          Tänään
        </p>

        {todayTasks.length === 0 && (
          <p className="mt-2 text-sm text-[var(--wood-muted)]">
            Ei kesken olevia työvaiheita juuri nyt.
          </p>
        )}

        {todayTasks.length > 0 && (
          <ul className="mt-2 space-y-2">
            {todayTasks.map((task) => (
              <li
                key={task.stepId}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    to={`/projects/${task.projectId}`}
                    className="block truncate font-medium text-[var(--wood-text)] hover:text-[var(--wood-accent)]"
                  >
                    {task.projectName}
                  </Link>

                  <p className="mt-0.5 text-sm text-[var(--wood-muted)]">
                    {task.stepTitle}
                    {task.deadline && (
                      <>
                        {" — "}
                        {formatDate(task.deadline)}
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleMarkDone(task)}
                  disabled={savingStepId === task.stepId}
                  className="shrink-0 rounded-lg border border-[var(--wood-accent)] px-3 py-1 text-xs text-[var(--wood-accent)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingStepId === task.stepId
                    ? "Tallennetaan..."
                    : "Valmis"}
                </button>
              </li>
            ))}
          </ul>
        )}

      </div>


      <div className="card p-4">

        <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
          Huomioitavaa
        </p>

        {visibleReminders.length === 0 && (
          <p className="mt-2 text-sm text-[var(--wood-muted)]">
            Ei muistutuksia juuri nyt.
          </p>
        )}

        {visibleReminders.length > 0 && (
          <ul className="mt-2 space-y-2">
            {visibleReminders.map((reminder, index) => {

              const content = (
                <span className="text-sm text-[var(--wood-text)]">
                  {reminder.message}
                </span>
              )

              const linkTo =
                reminder.type === "social_draft_missing"
                  ? `/projects/${reminder.projectId}?tab=social`
                  : `/projects/${reminder.projectId}`

              return (
                <li key={index}>
                  {reminder.projectId ? (
                    <Link
                      to={linkTo}
                      className="block hover:text-[var(--wood-accent)]"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              )

            })}
          </ul>
        )}

      </div>

    </section>
  )

}


export default DashboardSummary
