import {
  useLocation,
  useNavigate,
} from "react-router-dom"

import AIActivityWidget from "../components/ai/AIActivityWidget"
import AgentsPanel from "../components/ai/AgentsPanel"
import ChatPanel from "../components/ai/ChatPanel"
import MemoryPanel from "../components/ai/MemoryPanel"
import NotificationCenter from "../components/ai/NotificationCenter"
import RecentProjectsWidget from "../components/ai/RecentProjectsWidget"
import SystemStatus from "../components/ai/SystemStatus"
import TodaysFocusWidget from "../components/ai/TodaysFocusWidget"

import WorkspaceExecutionPanel from "../components/execution/WorkspaceExecutionPanel"


function AIWorkspace() {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const workspaceDock = [
    {
      label:
        "Workspace",

      icon:
        "🧠",

      path:
        "/",
    },

    {
      label:
        "Dashboard",

      icon:
        "📊",

      path:
        "/dashboard",
    },

    {
      label:
        "Projects",

      icon:
        "📦",

      path:
        "/projects",
    },

    {
      label:
        "Customers",

      icon:
        "👥",

      path:
        "/customers",
    },

    {
      label:
        "Execution",

      icon:
        "▶️",

      path:
        "/execution",
    },

    {
      label:
        "Capabilities",

      icon:
        "🧩",

      path:
        "/capabilities",
    },

    {
      label:
        "Knowledge",

      icon:
        "📚",

      path:
        "/knowledge",
    },

    {
      label:
        "Memory",

      icon:
        "💾",

      path:
        "/memory",
    },

    {
      label:
        "Tools",

      icon:
        "🛠️",

      path:
        "/tools",
    },
  ]

  const quickActions = [
    {
      label:
        "Avaa Execution Center",

      description:
        "Seuraa AI:n suunnittelua, toimintojonoa ja tuloksia.",

      icon:
        "▶️",

      path:
        "/execution",
    },

    {
      label:
        "Avaa projektit",

      description:
        "Näytä kaikki aktiiviset ja valmiit projektit.",

      icon:
        "📦",

      path:
        "/projects",
    },

    {
      label:
        "Avaa asiakkaat",

      description:
        "Siirry asiakasrekisteriin ja CRM-näkymään.",

      icon:
        "👥",

      path:
        "/customers",
    },

    {
      label:
        "Avaa Knowledge",

      description:
        "Selaa AI Brainin käytössä olevaa tietopankkia.",

      icon:
        "📚",

      path:
        "/knowledge",
    },
  ]


  function openWorkspace(
    path,
  ) {
    navigate(
      path,
    )
  }


  function isActivePath(
    path,
  ) {
    if (
      path ===
      "/"
    ) {
      return (
        location.pathname ===
        "/"
      )
    }

    return location.pathname.startsWith(
      path,
    )
  }


  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">
            Wood-Booster OS
          </p>

          <h1 className="mt-2 text-4xl font-bold text-white">
            AI Workspace
          </h1>

          <p className="mt-2 max-w-2xl text-neutral-400">
            Keskustele AI Brainin kanssa, anna järjestelmälle
            tehtäviä ja seuraa niiden suorittamista reaaliajassa.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />

            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>

          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Workspace
            </p>

            <p className="text-sm font-medium text-white">
              Valmis käyttöön
            </p>
          </div>
        </div>
      </header>

      <nav className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-2">
        <div className="flex min-w-max items-center gap-2">
          {workspaceDock.map(
            (
              item,
            ) => {
              const active =
                isActivePath(
                  item.path,
                )

              return (
                <button
                  key={
                    item.path
                  }
                  type="button"
                  onClick={() =>
                    openWorkspace(
                      item.path,
                    )
                  }
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <span>
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>
                </button>
              )
            },
          )}
        </div>
      </nav>

      <main className="grid flex-1 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-h-[760px] min-w-0">
          <ChatPanel />
        </section>

        <aside className="min-w-0 space-y-6">
          <WorkspaceExecutionPanel />

          <NotificationCenter />

          <AIActivityWidget />

          <TodaysFocusWidget />

          <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
            <div className="border-b border-neutral-800 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">
                System Panel
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                AI Workspacen palveluiden nykyinen tila.
              </p>
            </div>

            <div className="p-5">
              <SystemStatus />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
            <div className="border-b border-neutral-800 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Avaa tärkeimmät työtilat yhdellä painalluksella.
              </p>
            </div>

            <div className="grid gap-3 p-4">
              {quickActions.map(
                (
                  action,
                ) => (
                  <button
                    key={
                      action.path
                    }
                    type="button"
                    onClick={() =>
                      openWorkspace(
                        action.path,
                      )
                    }
                    className="group flex w-full items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-left transition hover:border-amber-500/50 hover:bg-neutral-800"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-xl transition group-hover:bg-amber-500/10">
                      {action.icon}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-white">
                        {action.label}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-neutral-500">
                        {action.description}
                      </span>
                    </span>

                    <span className="mt-1 text-neutral-600 transition group-hover:translate-x-1 group-hover:text-amber-400">
                      →
                    </span>
                  </button>
                ),
              )}
            </div>
          </section>

          <RecentProjectsWidget />

          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-white">
                Agentit
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                AI Brainin käytettävissä olevat asiantuntijat.
              </p>
            </div>

            <AgentsPanel />
          </section>

          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-white">
                Muisti
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Järjestelmän tallentama pitkäaikainen konteksti.
              </p>
            </div>

            <MemoryPanel />
          </section>
        </aside>
      </main>
    </div>
  )
}


export default AIWorkspace
