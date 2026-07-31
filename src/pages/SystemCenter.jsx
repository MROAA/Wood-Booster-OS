import AIActivityWidget from "../components/ai/AIActivityWidget"
import AgentsPanel from "../components/ai/AgentsPanel"
import MemoryPanel from "../components/ai/MemoryPanel"
import NotificationCenter from "../components/ai/NotificationCenter"
import RecentProjectsWidget from "../components/ai/RecentProjectsWidget"
import SystemStatus from "../components/ai/SystemStatus"
import TodaysFocusWidget from "../components/ai/TodaysFocusWidget"

import WorkspaceExecutionPanel from "../components/execution/WorkspaceExecutionPanel"


function SystemCenter() {
  return (
    <div className="mx-auto max-w-7xl">
      <header className="border-b border-neutral-800 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">
          Wood-Booster OS
        </p>

        <h1 className="mt-2 text-4xl font-bold text-white">
          System Center
        </h1>

        <p className="mt-2 max-w-3xl text-neutral-400">
          Seuraa AI Brainin toimintaa, järjestelmän tilaa,
          ilmoituksia, agentteja ja tallennettua muistia.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <WorkspaceExecutionPanel />

        <NotificationCenter />

        <AIActivityWidget />

        <TodaysFocusWidget />

        <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 px-5 py-4">
            <h2 className="text-lg font-semibold text-white">
              System Status
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              AI Workspacen palveluiden nykyinen tila.
            </p>
          </div>

          <div className="p-5">
            <SystemStatus />
          </div>
        </section>

        <RecentProjectsWidget />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="min-w-0">
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

        <section className="min-w-0">
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
      </div>
    </div>
  )
}


export default SystemCenter
