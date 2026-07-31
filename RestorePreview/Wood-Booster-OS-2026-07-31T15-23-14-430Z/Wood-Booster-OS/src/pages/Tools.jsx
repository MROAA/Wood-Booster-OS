import {
  getToolHealthReport,
} from "../services/tools/toolHealth"

import {
  getCapabilityManifest,
} from "../services/capabilities/capabilityManifest"


function Tools() {
  const report =
    getToolHealthReport()

  const {
    tools,
    summary,
  } = report

  const capabilities =
    getCapabilityManifest()

  const totalActions =
    tools.reduce(
      (sum, tool) =>
        sum + tool.actions.length,
      0,
    )

  const totalDependencies =
    capabilities.reduce(
      (sum, capability) =>
        sum + capability.tools.length,
      0,
    )

  return (
    <div className="space-y-8">
      <header>
        <p className="
          text-sm
          font-semibold
          uppercase
          tracking-[0.25em]
          text-amber-500
        ">
          AI Operating System
        </p>

        <h1 className="
          mt-2
          text-4xl
          font-bold
          text-white
        ">
          🛠 Tools Center
        </h1>

        <p className="
          mt-3
          max-w-3xl
          text-neutral-400
        ">
          Wood-Booster AI:n työkalut,
          niiden toimintotyypit,
          capability-riippuvuudet ja
          suorittajien todellinen tila.
        </p>
      </header>

      <section className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-5
      ">
        <StatCard
          label="Työkaluja"
          value={summary.total}
        />

        <StatCard
          label="Aktiivisia"
          value={summary.enabled}
        />

        <StatCard
          label="Terveitä"
          value={summary.healthy}
          valueClassName="text-emerald-400"
        />

        <StatCard
          label="Toimintoja"
          value={totalActions}
        />

        <StatCard
          label="Riippuvuuksia"
          value={totalDependencies}
        />
      </section>

      <section className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      ">
        <div className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        ">
          <div>
            <p className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.2em]
              text-neutral-500
            ">
              Tool Architecture
            </p>

            <h2 className="
              mt-2
              text-xl
              font-bold
              text-white
            ">
              Työkalujen suoritusketju
            </h2>
          </div>

          <SystemHealthBadge
            unhealthy={
              summary.unhealthy
            }
          />
        </div>

        <div className="
          mt-5
          flex
          flex-wrap
          items-center
          gap-2
          text-sm
        ">
          <ArchitectureNode
            label="Capability"
          />

          <ArchitectureArrow />

          <ArchitectureNode
            label="Tool Registry"
          />

          <ArchitectureArrow />

          <ArchitectureNode
            label="Action Support"
          />

          <ArchitectureArrow />

          <ArchitectureNode
            label="Tool Executor"
          />

          <ArchitectureArrow />

          <ArchitectureNode
            label="Result"
          />
        </div>
      </section>

      <section>
        <div className="
          mb-4
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        ">
          <div>
            <h2 className="
              text-2xl
              font-bold
              text-white
            ">
              Rekisteröidyt työkalut
            </h2>

            <p className="
              mt-1
              text-sm
              text-neutral-500
            ">
              Health Check vertaa Tool
              Manifestia oikeisiin
              suorittajiin.
            </p>
          </div>

          <p className="
            text-sm
            text-neutral-500
          ">
            {summary.healthy} /{" "}
            {summary.total} täysin
            toimintavalmiina
          </p>
        </div>

        <div className="
          grid
          grid-cols-1
          gap-5
          lg:grid-cols-2
          xl:grid-cols-3
        ">
          {tools.map(
            (tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                capabilities={
                  capabilities.filter(
                    (capability) =>
                      capability.tools.includes(
                        tool.id,
                      ),
                  )
                }
              />
            ),
          )}
        </div>
      </section>
    </div>
  )
}


function StatCard({
  label,
  value,
  valueClassName =
    "text-white",
}) {
  return (
    <div className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-5
    ">
      <p className="
        text-sm
        text-neutral-500
      ">
        {label}
      </p>

      <p
        className={`
          mt-2
          text-3xl
          font-bold
          ${valueClassName}
        `}
      >
        {value}
      </p>
    </div>
  )
}


function ArchitectureNode({
  label,
}) {
  return (
    <span className="
      rounded-lg
      border
      border-neutral-700
      bg-neutral-950
      px-3
      py-2
      font-medium
      text-neutral-300
    ">
      {label}
    </span>
  )
}


function ArchitectureArrow() {
  return (
    <span className="
      text-neutral-600
    ">
      →
    </span>
  )
}


function SystemHealthBadge({
  unhealthy,
}) {
  const healthy =
    unhealthy === 0

  return (
    <span
      className={
        healthy
          ? `
            w-fit
            rounded-full
            border
            border-emerald-900
            bg-emerald-950/40
            px-3
            py-1
            text-xs
            font-semibold
            text-emerald-400
          `
          : `
            w-fit
            rounded-full
            border
            border-red-900
            bg-red-950/40
            px-3
            py-1
            text-xs
            font-semibold
            text-red-400
          `
      }
    >
      {healthy
        ? "● SYSTEM HEALTHY"
        : `● ${unhealthy} TOOL ERROR`}
    </span>
  )
}


function ToolCard({
  tool,
  capabilities,
}) {
  const readiness =
    tool.actions.length > 0
      ? Math.round(
          (
            tool
              .supportedActions
              .length /
            tool.actions.length
          ) * 100,
        )
      : 0

  return (
    <article className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-5
    ">
      <div className="
        flex
        items-start
        justify-between
        gap-4
      ">
        <div>
          <p className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.2em]
            text-neutral-500
          ">
            {tool.id}
          </p>

          <h3 className="
            mt-2
            text-lg
            font-bold
            text-white
          ">
            {tool.name}
          </h3>
        </div>

        <ToolHealthBadge
          tool={tool}
        />
      </div>

      <p className="
        mt-4
        text-sm
        leading-6
        text-neutral-400
      ">
        {tool.description}
      </p>

      <div className="mt-5">
        <div className="
          flex
          items-center
          justify-between
          gap-4
        ">
          <p className="
            text-sm
            font-semibold
            text-neutral-300
          ">
            Executor readiness
          </p>

          <span className="
            text-xs
            font-semibold
            text-neutral-400
          ">
            {readiness} %
          </span>
        </div>

        <div className="
          mt-2
          h-2
          overflow-hidden
          rounded-full
          bg-neutral-800
        ">
          <div
            className={
              tool.healthy
                ? "h-full rounded-full bg-emerald-500"
                : "h-full rounded-full bg-red-500"
            }
            style={{
              width: `${readiness}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="
          flex
          items-center
          justify-between
        ">
          <h4 className="
            text-sm
            font-semibold
            text-neutral-300
          ">
            Käyttävät capabilityt
          </h4>

          <span className="
            text-xs
            text-neutral-500
          ">
            {capabilities.length}
          </span>
        </div>

        <div className="
          mt-3
          flex
          flex-wrap
          gap-2
        ">
          {capabilities.length ===
            0 && (
            <span className="
              text-xs
              text-neutral-600
            ">
              Ei capability-riippuvuuksia
            </span>
          )}

          {capabilities.map(
            (capability) => (
              <span
                key={capability.id}
                className="
                  rounded-lg
                  border
                  border-cyan-900
                  bg-cyan-950/20
                  px-2.5
                  py-1.5
                  font-mono
                  text-xs
                  text-cyan-400
                "
              >
                {capability.id}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="
          flex
          items-center
          justify-between
        ">
          <h4 className="
            text-sm
            font-semibold
            text-neutral-300
          ">
            Tuetut toiminnot
          </h4>

          <span className="
            text-xs
            text-neutral-500
          ">
            {
              tool.supportedActions
                .length
            }
            /
            {tool.actions.length}
          </span>
        </div>

        <div className="
          mt-3
          flex
          flex-wrap
          gap-2
        ">
          {tool.actions.map(
            (action) => {
              const supported =
                tool.supportedActions
                  .includes(action)

              return (
                <span
                  key={action}
                  className={
                    supported
                      ? `
                        rounded-lg
                        border
                        border-neutral-700
                        bg-neutral-950
                        px-2.5
                        py-1.5
                        font-mono
                        text-xs
                        text-amber-400
                      `
                      : `
                        rounded-lg
                        border
                        border-red-900
                        bg-red-950/30
                        px-2.5
                        py-1.5
                        font-mono
                        text-xs
                        text-red-400
                      `
                  }
                >
                  {action}
                </span>
              )
            },
          )}
        </div>
      </div>

      {tool.missingActions.length >
        0 && (
        <div className="
          mt-5
          rounded-xl
          border
          border-red-900
          bg-red-950/20
          p-3
        ">
          <p className="
            text-xs
            font-semibold
            text-red-400
          ">
            Puuttuvat suorittajat
          </p>

          <p className="
            mt-2
            text-xs
            text-red-300
          ">
            {tool.missingActions.join(
              ", ",
            )}
          </p>
        </div>
      )}
    </article>
  )
}


function ToolHealthBadge({
  tool,
}) {
  if (!tool.enabled) {
    return (
      <span className="
        rounded-full
        border
        border-neutral-700
        bg-neutral-800
        px-3
        py-1
        text-xs
        font-semibold
        text-neutral-400
      ">
        ● DISABLED
      </span>
    )
  }

  if (tool.healthy) {
    return (
      <span className="
        rounded-full
        border
        border-emerald-900
        bg-emerald-950/40
        px-3
        py-1
        text-xs
        font-semibold
        text-emerald-400
      ">
        ● HEALTHY
      </span>
    )
  }

  return (
    <span className="
      rounded-full
      border
      border-red-900
      bg-red-950/40
      px-3
      py-1
      text-xs
      font-semibold
      text-red-400
    ">
      ● ERROR
    </span>
  )
}


export default Tools
