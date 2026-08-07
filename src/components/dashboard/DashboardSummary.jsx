import {
  useEffect,
  useState,
} from "react"

import {
  Link,
} from "react-router-dom"

import {
  apiGet,
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
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [reminders, setReminders] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")


  useEffect(() => {

    let cancelled = false

    async function load() {

      setLoading(true)
      setError("")

      try {

        const [dashboardData, remindersData] = await Promise.all([
          apiGet("/dashboard"),
          apiGet("/reminders"),
        ])

        if (cancelled) {
          return
        }

        setSummary(dashboardData.summary)
        setUpcomingDeadlines(dashboardData.upcomingDeadlines || [])
        setReminders(remindersData.reminders || [])

      }
      catch (loadError) {

        console.error(
          "Dashboard summary error:",
          loadError,
        )

        if (!cancelled) {
          setError(
            loadError.message ||
              "Yhteenvedon lataaminen epäonnistui.",
          )
        }

      }
      finally {

        if (!cancelled) {
          setLoading(false)
        }

      }

    }

    load()

    return () => {
      cancelled = true
    }

  }, [])


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


  const nextDeadline = upcomingDeadlines[0]

  const visibleReminders = reminders.slice(0, 5)


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


      {nextDeadline && (
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
            Seuraava deadline
          </p>

          <Link
            to={`/projects/${nextDeadline.id}`}
            className="mt-2 block text-lg font-medium text-[var(--wood-accent)] hover:opacity-90"
          >
            {nextDeadline.name}
            {" — "}
            {formatDate(nextDeadline.deadline)}
          </Link>
        </div>
      )}


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

              return (
                <li key={index}>
                  {reminder.projectId ? (
                    <Link
                      to={`/projects/${reminder.projectId}`}
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
