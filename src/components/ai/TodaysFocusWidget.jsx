import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { apiGet } from "../../api/client"

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
}

function isCompletedProject(project) {
  const status = normalizeStatus(project.status)

  return (
    status === "valmis" ||
    status === "completed" ||
    status === "complete" ||
    status === "done"
  )
}

function getDeadlineTimestamp(project) {
  if (!project.deadline) {
    return null
  }

  const timestamp = new Date(
    project.deadline,
  ).getTime()

  if (Number.isNaN(timestamp)) {
    return null
  }

  return timestamp
}

function formatDeadline(deadline) {
  if (!deadline) {
    return "Ei määräaikaa"
  }

  const date = new Date(deadline)

  if (Number.isNaN(date.getTime())) {
    return "Virheellinen määräaika"
  }

  return new Intl.DateTimeFormat(
    "fi-FI",
    {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    },
  ).format(date)
}

function getDeadlineLabel(deadline) {
  if (!deadline) {
    return {
      text: "Ei määräaikaa",
      className:
        "bg-[var(--wood-card)] text-[var(--wood-muted)]",
    }
  }

  const deadlineDate = new Date(deadline)
  const today = new Date()

  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      text: "Virheellinen päivä",
      className:
        "bg-red-500/10 text-red-300",
    }
  }

  today.setHours(0, 0, 0, 0)
  deadlineDate.setHours(0, 0, 0, 0)

  const differenceInDays = Math.round(
    (deadlineDate - today) /
      (1000 * 60 * 60 * 24),
  )

  if (differenceInDays < 0) {
    return {
      text: `${Math.abs(
        differenceInDays,
      )} pv myöhässä`,
      className:
        "bg-red-500/10 text-red-300",
    }
  }

  if (differenceInDays === 0) {
    return {
      text: "Tänään",
      className:
        "bg-red-500/10 text-red-300",
    }
  }

  if (differenceInDays === 1) {
    return {
      text: "Huomenna",
      className:
        "bg-[var(--wood-accent)]/10 text-[var(--wood-accent)]",
    }
  }

  if (differenceInDays <= 7) {
    return {
      text: `${differenceInDays} päivän päästä`,
      className:
        "bg-[var(--wood-accent)]/10 text-[var(--wood-accent)]",
    }
  }

  return {
    text: formatDeadline(deadline),
    className:
      "bg-[var(--wood-card)] text-[var(--wood-muted)]",
  }
}

function TodaysFocusWidget() {
  const navigate = useNavigate()

  const [projects, setProjects] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    let isMounted = true

    async function loadProjects() {
      try {
        const data = await apiGet(
          "/projects",
        )

        if (!isMounted) {
          return
        }

        const projectList =
          Array.isArray(data)
            ? data
            : data.projects || []

        setProjects(projectList)
        setError("")
      } catch (loadError) {
        console.error(
          "Today's focus error:",
          loadError,
        )

        if (isMounted) {
          setError(
            "Päivän tehtävien lataaminen epäonnistui.",
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      isMounted = false
    }
  }, [])

  const focusProjects = useMemo(() => {
    return projects
      .filter(
        (project) =>
          !isCompletedProject(project),
      )
      .sort(
        (
          firstProject,
          secondProject,
        ) => {
          const firstDeadline =
            getDeadlineTimestamp(
              firstProject,
            )

          const secondDeadline =
            getDeadlineTimestamp(
              secondProject,
            )

          if (
            firstDeadline !== null &&
            secondDeadline !== null
          ) {
            return (
              firstDeadline -
              secondDeadline
            )
          }

          if (firstDeadline !== null) {
            return -1
          }

          if (secondDeadline !== null) {
            return 1
          }

          const firstUpdated =
            new Date(
              firstProject.updatedAt ||
                firstProject.createdAt ||
                0,
            ).getTime()

          const secondUpdated =
            new Date(
              secondProject.updatedAt ||
                secondProject.createdAt ||
                0,
            ).getTime()

          return (
            secondUpdated -
            firstUpdated
          )
        },
      )
      .slice(0, 3)
  }, [projects])

  function openProject(projectId) {
    navigate(
      `/projects/${projectId}`,
    )
  }

  function openProjects() {
    navigate("/projects")
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--wood-border)] px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--wood-text)]">
            Today&apos;s Focus
          </h2>

          <p className="mt-1 text-sm text-[var(--wood-muted)]">
            Tärkeimmät aktiiviset projektit.
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--wood-accent)]/10 text-xl">
          ◉
        </span>
      </div>

      <div className="p-4">
        {loading && (
          <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] px-4 py-5 text-sm text-[var(--wood-muted)]">
            Ladataan päivän tilannetta...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          focusProjects.length ===
            0 && (
            <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] px-4 py-5">
              <p className="text-sm font-medium text-[var(--wood-text)]">
                Ei aktiivisia projekteja
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--wood-muted)]">
                Kaikki projektit ovat valmiita
                tai projekteja ei ole vielä
                luotu.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          focusProjects.length >
            0 && (
            <div className="space-y-3">
              {focusProjects.map(
                (project, index) => {
                  const deadline =
                    getDeadlineLabel(
                      project.deadline,
                    )

                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() =>
                        openProject(
                          project.id,
                        )
                      }
                      className="group w-full rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-4 text-left transition hover:border-[var(--wood-accent)]/40 hover:bg-[var(--wood-card)]"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            index === 0
                              ? "bg-[var(--wood-accent)] text-[#17120c]"
                              : "bg-[var(--wood-card)] text-[var(--wood-muted)]"
                          }`}
                        >
                          {index + 1}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[var(--wood-text)]">
                            {project.name ||
                              "Nimetön projekti"}
                          </span>

                          <span className="mt-1 block text-xs text-[var(--wood-muted)]">
                            {project.status ||
                              "Ei tilaa"}
                          </span>
                        </span>

                        <span className="text-[var(--wood-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--wood-accent)]">
                          →
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${deadline.className}`}
                        >
                          {deadline.text}
                        </span>

                        {project.customer?.name && (
                          <span className="rounded-full bg-[var(--wood-card)] px-2.5 py-1 text-xs text-[var(--wood-muted)]">
                            {
                              project
                                .customer
                                .name
                            }
                          </span>
                        )}
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          )}

        <button
          type="button"
          onClick={openProjects}
          className="mt-4 w-full rounded-xl border border-[var(--wood-border)] px-4 py-3 text-sm font-medium text-[var(--wood-text)] transition hover:border-[var(--wood-accent)]/50 hover:bg-[var(--wood-accent)]/10 hover:text-[var(--wood-accent)]"
        >
          Hallitse projekteja
        </button>
      </div>
    </section>
  )
}

export default TodaysFocusWidget
