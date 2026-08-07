import InfoCard from "./InfoCard"
import Section from "./Section"
import StatusBadge from "./StatusBadge"


function normalizeArray(
  value,
) {
  if (!value) {
    return []
  }

  if (
    Array.isArray(
      value,
    )
  ) {
    return value.filter(
      Boolean,
    )
  }

  return [
    value,
  ]
}


function formatConfidence(
  value,
) {
  const numericValue =
    Number(
      value,
    )

  if (
    !Number.isFinite(
      numericValue,
    )
  ) {
    return "-"
  }

  return `${Math.round(
    numericValue * 100,
  )} %`
}


function getConfidencePercentage(
  value,
) {
  const numericValue =
    Number(
      value,
    )

  if (
    !Number.isFinite(
      numericValue,
    )
  ) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        numericValue * 100,
      ),
    ),
  )
}


function getCapabilityId(
  capabilityPlan,
) {
  if (!capabilityPlan) {
    return "not-selected"
  }

  if (
    typeof capabilityPlan ===
    "string"
  ) {
    return capabilityPlan
  }

  return (
    capabilityPlan.capabilityId ||
    capabilityPlan.capability ||
    capabilityPlan.id ||
    capabilityPlan.name ||
    "not-selected"
  )
}


function getActions(
  capabilityPlan,
) {
  if (!capabilityPlan) {
    return []
  }

  if (
    Array.isArray(
      capabilityPlan,
    )
  ) {
    return normalizeArray(
      capabilityPlan,
    )
  }

  return normalizeArray(
    capabilityPlan.actions ||
    capabilityPlan.steps,
  )
}


function getActionLabel(
  action,
  index,
) {
  if (
    typeof action ===
    "string"
  ) {
    return action
  }

  return (
    action?.label ||
    action?.name ||
    action?.command ||
    action?.type ||
    `Toiminto ${index + 1}`
  )
}


function getActionDescription(
  action,
) {
  if (
    !action ||
    typeof action !==
      "object"
  ) {
    return ""
  }

  return (
    action.description ||
    action.message ||
    action.reason ||
    ""
  )
}


function CapabilityPlanCard({
  capabilityPlan,
  status = "idle",
}) {
  const actions =
    getActions(
      capabilityPlan,
    )

  const capabilityId =
    getCapabilityId(
      capabilityPlan,
    )

  const intent =
    capabilityPlan?.intent ||
    "unknown"

  const confidence =
    capabilityPlan?.confidence

  const confidencePercentage =
    getConfidencePercentage(
      confidence,
    )

  const source =
    capabilityPlan?.source ||
    "unknown"

  return (
    <Section
      title="Capability Plan"
      description="Plannerin valitsema järjestelmäkyvykkyys ja siihen kuuluvat toiminnot."
      action={
        <StatusBadge
          status={
            status
          }
        />
      }
    >
      {!capabilityPlan ? (
        <div className="rounded-xl border border-dashed border-[var(--wood-border)] bg-[var(--wood-bg)] p-6 text-center">
          <p className="text-sm text-[var(--wood-muted)]">
            Capability Plania ei ole vielä muodostettu.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Capability"
              value={
                capabilityId
              }
            />

            <InfoCard
              label="Intent"
              value={
                intent
              }
            />

            <InfoCard
              label="Confidence"
              value={
                formatConfidence(
                  confidence,
                )
              }
            />

            <InfoCard
              label="Actions"
              value={
                actions.length
              }
            />
          </div>

          <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--wood-muted)]">
                  Planner Confidence
                </p>

                <p className="mt-1 text-sm font-semibold text-[var(--wood-text)]">
                  {formatConfidence(
                    confidence,
                  )}
                </p>
              </div>

              <StatusBadge
                status={
                  confidencePercentage >=
                  80
                    ? "ready"
                    : confidencePercentage >=
                        50
                      ? "warning"
                      : "idle"
                }
              />
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--wood-card)]">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{
                  width:
                    `${confidencePercentage}%`,
                }}
              />
            </div>
          </div>

          <InfoCard
            label="Planner Source"
            className="border-sky-500/20 bg-sky-500/5"
          >
            <p className="break-words text-sm text-[var(--wood-text)]">
              {source}
            </p>
          </InfoCard>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[var(--wood-text)]">
                  Capability Actions
                </h3>

                <p className="mt-1 text-xs text-[var(--wood-muted)]">
                  Plannerin tähän capabilityyn liittämät suoritettavat toiminnot.
                </p>
              </div>

              <StatusBadge
                status={
                  actions.length >
                  0
                    ? "ready"
                    : "idle"
                }
              >
                {actions.length}
              </StatusBadge>
            </div>

            {actions.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-[var(--wood-border)] bg-[var(--wood-bg)] p-5">
                <p className="text-sm text-[var(--wood-muted)]">
                  Capability ei sisältänyt suoritettavia toimintoja.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map(
                  (
                    action,
                    index,
                  ) => {
                    const description =
                      getActionDescription(
                        action,
                      )

                    return (
                      <div
                        key={
                          action?.id ||
                          `${getActionLabel(
                            action,
                            index,
                          )}-${index}`
                        }
                        className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-4"
                      >
                        <div className="flex items-start gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-bold text-violet-300">
                            {index +
                              1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="break-words font-semibold text-[var(--wood-text)]">
                                  {getActionLabel(
                                    action,
                                    index,
                                  )}
                                </p>

                                {action?.type && (
                                  <p className="mt-1 text-xs text-[var(--wood-muted)]">
                                    Tyyppi:{" "}
                                    {
                                      action.type
                                    }
                                  </p>
                                )}
                              </div>

                              <StatusBadge
                                status={
                                  action?.status ||
                                  "pending"
                                }
                              />
                            </div>

                            {description && (
                              <p className="mt-3 break-words text-sm leading-6 text-[var(--wood-muted)]">
                                {
                                  description
                                }
                              </p>
                            )}

                            {action?.payload && (
                              <div className="mt-3 rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] p-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--wood-muted)]">
                                  Payload
                                </p>

                                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--wood-text)]">
                                  {JSON.stringify(
                                    action.payload,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  )
}


export default CapabilityPlanCard
