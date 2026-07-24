import {
  getAgentManifest,
} from "../services/agents/agentManifest"


function Agents() {
  const agents =
    getAgentManifest()

  const activeAgents =
    agents.filter(
      (agent) =>
        agent.status === "ACTIVE",
    )

  const truthSources =
    [
      ...new Set(
        agents.flatMap(
          (agent) =>
            agent.truthSources,
        ),
      ),
    ]

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-500">
          AI Brain
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          🤖 Agent Control Center
        </h1>

        <p className="mt-3 max-w-3xl text-neutral-400">
          Wood-Booster AI käyttää agenttireititystä valitakseen tehtävään
          parhaiten sopivan agentin. Agentit käyttävät Truth Layerin
          vahvistettua tietoa.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Active agents"
          value={activeAgents.length}
          description="Kaikki agentit käytettävissä"
        />

        <SummaryCard
          title="Routing"
          value="AUTO"
          description="Backend valitsee agentin"
        />

        <SummaryCard
          title="Truth Layer"
          value={truthSources.length}
          description="Vahvistettua tietolähdettä"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
          />
        ))}
      </section>
    </div>
  )
}


function SummaryCard({
  title,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-sm text-neutral-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-sm text-neutral-400">
        {description}
      </p>
    </div>
  )
}


function AgentCard({
  agent,
}) {
  const isActive =
    agent.status === "ACTIVE"

  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 text-2xl">
            {agent.icon}
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {agent.name}
            </h2>

            <p
              className={
                isActive
                  ? "mt-1 text-sm text-green-400"
                  : "mt-1 text-sm text-neutral-500"
              }
            >
              ● {agent.status}
            </p>
          </div>
        </div>

        <span className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
          {agent.id}
        </span>
      </div>

      <p className="mt-5 leading-7 text-neutral-400">
        {agent.description}
      </p>

      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Capabilities
        </h3>

        <div className="mt-3 space-y-2">
          {agent.capabilities.map(
            (capability) => (
              <div
                key={capability}
                className="rounded-xl bg-neutral-800 px-4 py-3 text-sm text-neutral-300"
              >
                {capability}
              </div>
            ),
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Truth sources
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          {agent.truthSources.map(
            (source) => (
              <span
                key={source}
                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-400"
              >
                {source}
              </span>
            ),
          )}
        </div>
      </div>
    </article>
  )
}


export default Agents
