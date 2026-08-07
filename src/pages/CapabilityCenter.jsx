import {
  getCapabilityHealthReport,
} from "../services/capabilities/capabilityHealth"


function calculateReadiness(
  capabilities,
) {
  const totalTools =
    capabilities.reduce(
      (sum, capability) =>
        sum +
        capability.tools.length,
      0,
    )

  const availableTools =
    capabilities.reduce(
      (sum, capability) =>
        sum +
        capability
          .availableTools
          .length,
      0,
    )

  if (totalTools === 0) {
    return 0
  }

  return Math.round(
    (
      availableTools /
      totalTools
    ) * 100,
  )
}


function CapabilityCenter() {
  const report =
    getCapabilityHealthReport()

  const {
    capabilities,
    summary,
  } = report

  const readiness =
    calculateReadiness(
      capabilities,
    )

  const totalActions =
    capabilities.reduce(
      (sum, capability) =>
        sum +
        capability.actions.length,
      0,
    )

  const totalToolDependencies =
    capabilities.reduce(
      (sum, capability) =>
        sum +
        capability.tools.length,
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
          text-[var(--wood-accent)]
        ">
          AI Operating System
        </p>

        <h1 className="
          mt-2
          text-4xl
          font-bold
          text-[var(--wood-text)]
        ">
          ⬢ Capability Center
        </h1>

        <p className="
          mt-3
          max-w-3xl
          text-[var(--wood-muted)]
        ">
          Wood-Booster AI:n
          kyvykkyysrekisteri,
          työkaluriippuvuudet ja
          järjestelmän todellinen
          toimintavalmius.
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
          label="Kyvykkyyksiä"
          value={summary.total}
        />

        <StatCard
          label="Terveitä"
          value={summary.healthy}
          valueClassName="text-emerald-400"
        />

        <StatCard
          label="Ongelmia"
          value={summary.unhealthy}
          valueClassName={
            summary.unhealthy > 0
              ? "text-red-400"
              : "text-[var(--wood-text)]"
          }
        />

        <StatCard
          label="Toimintoja"
          value={totalActions}
        />

        <StatCard
          label="Valmius"
          value={`${readiness} %`}
          valueClassName={
            readiness === 100
              ? "text-emerald-400"
              : readiness >= 50
                ? "text-[var(--wood-accent)]"
                : "text-red-400"
          }
        />
      </section>

      <section className="
        rounded-2xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        p-5
      ">
        <div className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        ">
          <div>
            <p className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.2em]
              text-[var(--wood-muted)]
            ">
              Capability Architecture
            </p>

            <h2 className="
              mt-2
              text-xl
              font-bold
              text-[var(--wood-text)]
            ">
              AI:n toimintaketju
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
            label="AI Session"
          />

          <ArchitectureArrow />

          <ArchitectureNode
            label="Capability Planner"
          />

          <ArchitectureArrow />

          <ArchitectureNode
            label="Capability Registry"
          />

          <ArchitectureArrow />

          <ArchitectureNode
            label="Tool Registry"
          />

          <ArchitectureArrow />

          <ArchitectureNode
            label="Action Queue"
          />

          <ArchitectureArrow />

          <ArchitectureNode
            label="Execution"
          />
        </div>

        <div className="
          mt-5
          grid
          gap-4
          sm:grid-cols-3
        ">
          <InfoCard
            label="Capabilityt"
            value={`${summary.enabled} / ${summary.total}`}
            description="Käytössä olevat kyvykkyydet"
          />

          <InfoCard
            label="Työkaluriippuvuudet"
            value={totalToolDependencies}
            description="Capabilityjen vaatimat työkalut"
          />

          <InfoCard
            label="Rekisteröidyt toiminnot"
            value={totalActions}
            description="AI:n tunnistamat action-tyypit"
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
              text-[var(--wood-text)]
            ">
              Rekisteröidyt kyvykkyydet
            </h2>

            <p className="
              mt-1
              text-sm
              text-[var(--wood-muted)]
            ">
              Health Check vertaa
              Capability Manifestia
              käytettävissä oleviin
              työkaluihin.
            </p>
          </div>

          <p className="
            text-sm
            text-[var(--wood-muted)]
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
          {capabilities.map(
            (capability) => (
              <CapabilityCard
                key={capability.id}
                capability={
                  capability
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
    "text-[var(--wood-text)]",
}) {
  return (
    <div className="
      rounded-2xl
      border
      border-[var(--wood-border)]
      bg-[var(--wood-panel)]
      p-5
    ">
      <p className="
        text-sm
        text-[var(--wood-muted)]
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


function InfoCard({
  label,
  value,
  description,
}) {
  return (
    <div className="
      rounded-xl
      border
      border-[var(--wood-border)]
      bg-[var(--wood-bg)]
      p-4
    ">
      <p className="
        text-xs
        uppercase
        tracking-wider
        text-[var(--wood-muted)]
      ">
        {label}
      </p>

      <p className="
        mt-2
        text-2xl
        font-bold
        text-[var(--wood-text)]
      ">
        {value}
      </p>

      <p className="
        mt-2
        text-xs
        text-[var(--wood-muted)]
      ">
        {description}
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
      border-[var(--wood-border)]
      bg-[var(--wood-bg)]
      px-3
      py-2
      font-medium
      text-[var(--wood-text)]
    ">
      {label}
    </span>
  )
}


function ArchitectureArrow() {
  return (
    <span className="
      text-[var(--wood-muted)]
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
        : `● ${unhealthy} CAPABILITY ERROR`}
    </span>
  )
}


function CapabilityCard({
  capability,
}) {
  const toolReadiness =
    capability.tools.length > 0
      ? Math.round(
          (
            capability
              .availableTools
              .length /
            capability.tools.length
          ) * 100,
        )
      : 0

  return (
    <article className="
      rounded-2xl
      border
      border-[var(--wood-border)]
      bg-[var(--wood-panel)]
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
            text-[var(--wood-muted)]
          ">
            {capability.id}
          </p>

          <h3 className="
            mt-2
            text-lg
            font-bold
            text-[var(--wood-text)]
          ">
            {capability.name}
          </h3>
        </div>

        <CapabilityHealthBadge
          capability={
            capability
          }
        />
      </div>

      <p className="
        mt-4
        text-sm
        leading-6
        text-[var(--wood-muted)]
      ">
        {capability.description}
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
            text-[var(--wood-text)]
          ">
            Tool readiness
          </p>

          <span className="
            text-xs
            font-semibold
            text-[var(--wood-muted)]
          ">
            {toolReadiness} %
          </span>
        </div>

        <div className="
          mt-2
          h-2
          overflow-hidden
          rounded-full
          bg-[var(--wood-card)]
        ">
          <div
            className={
              capability.health ===
              "healthy"
                ? "h-full rounded-full bg-emerald-500"
                : capability.health ===
                    "partial"
                  ? "h-full rounded-full bg-[var(--wood-accent)]"
                  : "h-full rounded-full bg-red-500"
            }
            style={{
              width:
                `${toolReadiness}%`,
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
            text-[var(--wood-text)]
          ">
            Työkalut
          </h4>

          <span className="
            text-xs
            text-[var(--wood-muted)]
          ">
            {
              capability
                .availableTools
                .length
            }
            /
            {
              capability.tools
                .length
            }
          </span>
        </div>

        <div className="
          mt-3
          flex
          flex-wrap
          gap-2
        ">
          {capability.tools.map(
            (toolId) => {
              const available =
                capability
                  .availableTools
                  .includes(toolId)

              return (
                <span
                  key={toolId}
                  className={
                    available
                      ? `
                        rounded-lg
                        border
                        border-[var(--wood-border)]
                        bg-[var(--wood-bg)]
                        px-2.5
                        py-1.5
                        font-mono
                        text-xs
                        text-cyan-400
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
                  {toolId}
                </span>
              )
            },
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
            text-[var(--wood-text)]
          ">
            Toiminnot
          </h4>

          <span className="
            text-xs
            text-[var(--wood-muted)]
          ">
            {capability.actions.length}
          </span>
        </div>

        <div className="
          mt-3
          flex
          flex-wrap
          gap-2
        ">
          {capability.actions.map(
            (action) => (
              <span
                key={action}
                className="
                  rounded-lg
                  border
                  border-[var(--wood-border)]
                  bg-[var(--wood-bg)]
                  px-2.5
                  py-1.5
                  font-mono
                  text-xs
                  text-[var(--wood-accent)]
                "
              >
                {action}
              </span>
            ),
          )}
        </div>
      </div>

      {capability.missingTools
        .length > 0 && (
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
            Puuttuvat työkalut
          </p>

          <p className="
            mt-2
            text-xs
            text-red-300
          ">
            {
              capability
                .missingTools
                .join(", ")
            }
          </p>
        </div>
      )}
    </article>
  )
}


function CapabilityHealthBadge({
  capability,
}) {
  if (!capability.enabled) {
    return (
      <span className="
        rounded-full
        border
        border-[var(--wood-border)]
        bg-[var(--wood-card)]
        px-3
        py-1
        text-xs
        font-semibold
        text-[var(--wood-muted)]
      ">
        ● DISABLED
      </span>
    )
  }

  if (
    capability.health ===
    "healthy"
  ) {
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

  if (
    capability.health ===
    "partial"
  ) {
    return (
      <span className="
        rounded-full
        border
        border-[var(--wood-accent)]
        bg-[var(--wood-accent)]/10
        px-3
        py-1
        text-xs
        font-semibold
        text-[var(--wood-accent)]
      ">
        ● PARTIAL
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
      ● UNAVAILABLE
    </span>
  )
}


export default CapabilityCenter
