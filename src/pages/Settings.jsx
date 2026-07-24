import {
  getSystemRegistry,
} from "../services/system/systemRegistry"


function Settings() {
  const system =
    getSystemRegistry()

  const {
    metadata,
    status,
    summary,
  } = system

  const settingsGroups = [
    {
      title: "System Registry",
      icon: "🖥️",
      items: [
        {
          name: "System",
          value: metadata.name,
          status:
            status.health.toUpperCase(),
        },
        {
          name: "Version",
          value: metadata.version,
          status: "LOADED",
        },
        {
          name: "Environment",
          value: metadata.environment,
          status: "READY",
        },
        {
          name: "System Mode",
          value: status.mode,
          status:
            status.healthy
              ? "HEALTHY"
              : "DEGRADED",
        },
      ],
    },

    {
      title: "Architecture",
      icon: "🏗️",
      items: [
        {
          name: "Frontend",
          value: metadata.frontend,
          status: "READY",
        },
        {
          name: "Backend",
          value: metadata.backend,
          status: "READY",
        },
        {
          name: "Database",
          value: metadata.database,
          status: "READY",
        },
        {
          name: "Routes",
          value: `${summary.routes} registered`,
          status: "LOADED",
        },
      ],
    },

    {
      title: "AI System",
      icon: "🧠",
      items: [
        {
          name: "AI Runtime",
          value: metadata.aiRuntime,
          status:
            status.aiRuntime.toUpperCase(),
        },
        {
          name: "AI Model",
          value: metadata.aiModel,
          status: "READY",
        },
        {
          name: "Agents",
          value:
            `${summary.activeAgents} / ${summary.agents} active`,
          status:
            summary.activeAgents ===
            summary.agents
              ? "ACTIVE"
              : "PARTIAL",
        },
        {
          name: "Truth Sources",
          value:
            `${summary.truthSources} registered`,
          status: "LOADED",
        },
      ],
    },

    {
      title: "Execution System",
      icon: "⚡",
      items: [
        {
          name: "Capabilities",
          value:
            `${summary.enabledCapabilities} / ${summary.capabilities} enabled`,
          status:
            summary.enabledCapabilities ===
            summary.capabilities
              ? "READY"
              : "PARTIAL",
        },
        {
          name: "Healthy Capabilities",
          value:
            `${summary.healthyCapabilities} available`,
          status:
            summary.healthyCapabilities ===
            summary.enabledCapabilities
              ? "HEALTHY"
              : "DEGRADED",
        },
        {
          name: "Tools",
          value:
            `${summary.healthyTools} / ${summary.tools} healthy`,
          status:
            summary.unhealthyTools === 0
              ? "HEALTHY"
              : "DEGRADED",
        },
        {
          name: "Actions",
          value:
            `${summary.actions} registered`,
          status: "AVAILABLE",
        },
      ],
    },
  ]

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-500">
          System Control
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          ⚙ Settings
        </h1>

        <p className="mt-3 max-w-3xl text-neutral-400">
          Wood-Booster AI OS:n järjestelmärekisteri ja
          nykyinen toimintavalmius.
        </p>
      </header>

      <SystemStatus
        status={status}
      />

      <section className="space-y-8">
        {settingsGroups.map(
          (group) => (
            <SettingsGroup
              key={group.title}
              group={group}
            />
          ),
        )}
      </section>
    </div>
  )
}


function SystemStatus({
  status,
}) {
  const healthy =
    status.healthy

  return (
    <section
      className={
        healthy
          ? "rounded-2xl border border-green-500/30 bg-green-500/10 p-6"
          : "rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"
      }
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            System status
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {healthy
              ? "Wood-Booster AI OS is operational"
              : "Wood-Booster AI OS is degraded"}
          </h2>

          <p className="mt-2 text-neutral-400">
            Agentit, capabilityt, työkalut ja reitit on
            koottu yhteiseen System Registryyn.
          </p>
        </div>

        <span
          className={
            healthy
              ? "w-fit rounded-full border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400"
              : "w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-400"
          }
        >
          {healthy
            ? "● HEALTHY"
            : "● DEGRADED"}
        </span>
      </div>
    </section>
  )
}


function SettingsGroup({
  group,
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">
          {group.icon}
        </span>

        <h2 className="text-2xl font-bold">
          {group.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {group.items.map(
          (item) => (
            <SettingsCard
              key={item.name}
              item={item}
            />
          ),
        )}
      </div>
    </section>
  )
}


function SettingsCard({
  item,
}) {
  const warningStatuses = [
    "DEGRADED",
    "PARTIAL",
    "OFFLINE",
    "ERROR",
  ]

  const warning =
    warningStatuses.includes(
      item.status,
    )

  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex justify-between gap-3">
        <h3 className="font-bold">
          {item.name}
        </h3>

        <span
          className={
            warning
              ? "text-xs text-amber-400"
              : "text-xs text-green-400"
          }
        >
          {warning
            ? "🟠"
            : "🟢"}{" "}
          {item.status}
        </span>
      </div>

      <p className="mt-4 break-words text-neutral-400">
        {item.value}
      </p>
    </article>
  )
}


export default Settings
