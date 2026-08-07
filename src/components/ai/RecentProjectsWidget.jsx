import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { apiGet } from "../../api/client"

function RecentProjectsWidget() {
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadProjects() {
      try {
        const data = await apiGet("/projects")

        if (!isMounted) {
          return
        }

        const projectList = Array.isArray(data)
          ? data
          : data.projects || []

        const recentProjects = [...projectList]
          .sort((firstProject, secondProject) => {
            const firstDate = new Date(
              firstProject.updatedAt ||
                firstProject.createdAt ||
                0,
            )

            const secondDate = new Date(
              secondProject.updatedAt ||
                secondProject.createdAt ||
                0,
            )

            return secondDate - firstDate
          })
          .slice(0, 4)

        setProjects(recentProjects)
        setError("")
      } catch (loadError) {
        console.error(
          "Recent projects error:",
          loadError,
        )

        if (isMounted) {
          setError(
            "Projektien lataaminen epäonnistui.",
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

  function openProject(projectId) {
    navigate(`/projects/${projectId}`)
  }

  function openAllProjects() {
    navigate("/projects")
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--wood-border)] px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--wood-text)]">
            Recent Projects
          </h2>

          <p className="mt-1 text-sm text-[var(--wood-muted)]">
            Viimeksi päivitetyt projektit.
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--wood-card)] text-xl">
          ▣
        </span>
      </div>

      <div className="p-4">
        {loading && (
          <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] px-4 py-5 text-sm text-[var(--wood-muted)]">
            Ladataan projekteja...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          projects.length === 0 && (
            <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] px-4 py-5">
              <p className="text-sm font-medium text-[var(--wood-text)]">
                Ei projekteja
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--wood-muted)]">
                Luo ensimmäinen projekti Projects-näkymässä.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          projects.length > 0 && (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() =>
                    openProject(project.id)
                  }
                  className="group flex w-full items-center gap-3 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3 text-left transition hover:border-[var(--wood-accent)]/40 hover:bg-[var(--wood-card)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--wood-card)] text-base">
                    ◇
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--wood-text)]">
                      {project.name ||
                        "Nimetön projekti"}
                    </span>

                    <span className="mt-0.5 block text-xs text-[var(--wood-muted)]">
                      {project.status ||
                        "Ei tilaa"}
                    </span>
                  </span>

                  <span className="text-[var(--wood-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--wood-accent)]">
                    →
                  </span>
                </button>
              ))}
            </div>
          )}

        <button
          type="button"
          onClick={openAllProjects}
          className="mt-4 w-full rounded-xl border border-[var(--wood-border)] px-4 py-3 text-sm font-medium text-[var(--wood-text)] transition hover:border-[var(--wood-accent)]/50 hover:bg-[var(--wood-accent)]/10 hover:text-[var(--wood-accent)]"
        >
          Avaa kaikki projektit
        </button>
      </div>
    </section>
  )
}

export default RecentProjectsWidget
