import InfoCard from "./InfoCard"
import Section from "./Section"
import StatusBadge from "./StatusBadge"


function normalizeStatus(
  value,
) {
  return String(
    value ||
    "idle",
  )
    .trim()
    .toLowerCase()
}


function formatTimestamp(
  timestamp,
) {
  if (!timestamp) {
    return "-"
  }

  const date =
    new Date(
      timestamp,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-"
  }

  return date.toLocaleString(
    "fi-FI",
    {
      dateStyle:
        "short",

      timeStyle:
        "medium",
    },
  )
}


function formatDuration(
  startedAt,
  completedAt,
) {
  if (!startedAt) {
    return "-"
  }

  const start =
    new Date(
      startedAt,
    ).getTime()

  const end =
    completedAt
      ? new Date(
          completedAt,
        ).getTime()
      : Date.now()

  if (
    !Number.isFinite(
      start,
    ) ||
    !Number.isFinite(
      end,
    )
  ) {
    return "-"
  }

  const milliseconds =
    Math.max(
      0,
      end - start,
    )

  if (
    milliseconds <
    1000
  ) {
    return `${milliseconds} ms`
  }

  const seconds =
    milliseconds /
    1000

  if (
    seconds <
    60
  ) {
    return `${seconds.toFixed(
      1,
    )} s`
  }

  const minutes =
    Math.floor(
      seconds /
      60,
    )

  const remainingSeconds =
    Math.round(
      seconds %
      60,
    )

  return `${minutes} min ${remainingSeconds} s`
}


function normalizeItems(
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


function getIntent(
  activity,
) {
  return (
    activity?.intentAnalysis
      ?.primaryIntent ||
    activity?.intentAnalysis
      ?.intent ||
    activity?.plannerDecision
      ?.intent ||
    activity?.plan
      ?.intent ||
    "-"
  )
}


function getConfidence(
  activity,
) {
  const confidence =
    activity?.intentAnalysis
      ?.confidence ??
    activity?.plannerDecision
      ?.confidence ??
    activity?.confidence

  if (
    confidence ===
      undefined ||
    confidence ===
      null ||
    confidence ===
      ""
  ) {
    return "-"
  }

  const number =
    Number(
      confidence,
    )

  if (
    !Number.isFinite(
      number,
    )
  ) {
    return String(
      confidence,
    )
  }

  if (
    number <=
    1
  ) {
    return `${Math.round(
      number *
        100,
    )} %`
  }

  return `${Math.round(
    number,
  )} %`
}


function getCapability(
  activity,
) {
  const capability =
    activity?.plannerDecision
      ?.capability ||
    activity?.plannerDecision
      ?.capabilityId ||
    activity?.plannerDecision
      ?.selectedCapability ||
    activity?.plan
      ?.capability ||
    activity?.plan
      ?.capabilityId

  if (!capability) {
    return "-"
  }

  if (
    typeof capability ===
    "string"
  ) {
    return capability
  }

  return (
    capability.label ||
    capability.name ||
    capability.id ||
    capability.capabilityId ||
    "-"
  )
}


function getActions(
  activity,
) {
  return normalizeItems(
    activity?.actions ||
    activity?.plannerDecision
      ?.actions ||
    activity?.executionPlan
      ?.actions,
  )
}


function getExecutionSteps(
  activity,
) {
  const executionPlan =
    activity?.executionPlan

  if (
    Array.isArray(
      executionPlan,
    )
  ) {
    return executionPlan
  }

  return normalizeItems(
    executionPlan?.steps,
  )
}


function getErrorMessage(
  activity,
) {
  const error =
    activity?.error

  if (!error) {
    return (
      activity?.reason ||
      ""
    )
  }

  if (
    typeof error ===
    "string"
  ) {
    return error
  }

  return (
    error.message ||
    JSON.stringify(
      error,
      null,
      2,
    )
  )
}


function CurrentSessionCard({
  activity,
}) {
  const safeActivity =
    activity ||
    {}

  const status =
    normalizeStatus(
      safeActivity.status,
    )

  const startedAt =
    safeActivity.startedAt ||
    safeActivity.timestamp ||
    safeActivity.createdAt ||
    null

  const completedAt =
    safeActivity.completedAt ||
    safeActivity.finishedAt ||
    null

  const actions =
    getActions(
      safeActivity,
    )

  const executionSteps =
    getExecutionSteps(
      safeActivity,
    )

  const errorMessage =
    getErrorMessage(
      safeActivity,
    )

  const hasActivity =
    Boolean(
      safeActivity.question ||
      safeActivity.answer ||
      safeActivity.timestamp ||
      safeActivity.startedAt ||
      safeActivity.intentAnalysis ||
      safeActivity.plannerDecision,
    )

  return (
    <Section
      title="Current Session"
      description="Näyttää nykyisen AI-istunnon pyynnön, analyysin, plannerin päätöksen ja lopputuloksen."
      action={
        <StatusBadge
          status={
            status
          }
        />
      }
    >
      {!hasActivity ? (
        <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-6 text-center">
          <p className="text-sm text-neutral-500">
            Aktiivista AI-istuntoa ei ole.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Agentti"
              value={
                safeActivity.agent ||
                safeActivity.agentId ||
                "system"
              }
            />

            <InfoCard
              label="Intent"
              value={
                getIntent(
                  safeActivity,
                )
              }
            />

            <InfoCard
              label="Confidence"
              value={
                getConfidence(
                  safeActivity,
                )
              }
            />

            <InfoCard
              label="Capability"
              value={
                getCapability(
                  safeActivity,
                )
              }
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Session tyyppi"
              value={
                safeActivity.type ||
                "-"
              }
            />

            <InfoCard
              label="Lähde"
              value={
                safeActivity.source ||
                safeActivity.intentAnalysis
                  ?.source ||
                "-"
              }
            />

            <InfoCard
              label="Toimintoja"
              value={
                actions.length
              }
            />

            <InfoCard
              label="Execution-vaiheita"
              value={
                executionSteps.length
              }
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Aloitettu"
              value={
                formatTimestamp(
                  startedAt,
                )
              }
            />

            <InfoCard
              label="Valmistunut"
              value={
                formatTimestamp(
                  completedAt,
                )
              }
            />

            <InfoCard
              label="Kesto"
              value={
                formatDuration(
                  startedAt,
                  completedAt,
                )
              }
            />

            <InfoCard
              label="Session ID"
              value={
                safeActivity.id ||
                safeActivity.sessionId ||
                "-"
              }
            />
          </div>

          <InfoCard
            label="Käyttäjän pyyntö"
            className="mt-4"
          >
            <p className="whitespace-pre-wrap break-words text-white">
              {safeActivity.question ||
                "Ei käyttäjän pyyntöä."}
            </p>
          </InfoCard>

          {safeActivity.intentAnalysis && (
            <InfoCard
              label="Intent Analysis"
              className="mt-4 border-sky-500/20 bg-sky-500/5"
            >
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-300">
                {JSON.stringify(
                  safeActivity.intentAnalysis,
                  null,
                  2,
                )}
              </pre>
            </InfoCard>
          )}

          {safeActivity.plannerDecision && (
            <InfoCard
              label="Planner Decision"
              className="mt-4 border-violet-500/20 bg-violet-500/5"
            >
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-300">
                {JSON.stringify(
                  safeActivity.plannerDecision,
                  null,
                  2,
                )}
              </pre>
            </InfoCard>
          )}

          {executionSteps.length > 0 && (
            <InfoCard
              label="Execution Plan"
              className="mt-4"
            >
              <div className="space-y-3">
                {executionSteps.map(
                  (
                    step,
                    index,
                  ) => {
                    const title =
                      typeof step ===
                      "string"
                        ? step
                        : step?.label ||
                          step?.name ||
                          step?.title ||
                          step?.type ||
                          `Vaihe ${index + 1}`

                    const stepStatus =
                      typeof step ===
                      "string"
                        ? "ready"
                        : step?.status ||
                          "ready"

                    return (
                      <div
                        key={
                          step?.id ||
                          `execution-step-${index}`
                        }
                        className="rounded-lg border border-neutral-800 bg-neutral-950 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-bold text-violet-300">
                              {index + 1}
                            </span>

                            <p className="break-words text-sm font-semibold text-white">
                              {title}
                            </p>
                          </div>

                          <StatusBadge
                            status={
                              stepStatus
                            }
                          />
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            </InfoCard>
          )}

          {safeActivity.answer && (
            <InfoCard
              label="AI:n vastaus"
              className="mt-4 border-emerald-500/20 bg-emerald-500/5"
            >
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-300">
                {safeActivity.answer}
              </p>
            </InfoCard>
          )}

          {safeActivity.reason && (
            <InfoCard
              label="Päätöksen peruste"
              className="mt-4 border-sky-500/20 bg-sky-500/5"
            >
              <p className="whitespace-pre-wrap break-words text-sm text-neutral-300">
                {safeActivity.reason}
              </p>
            </InfoCard>
          )}

          {errorMessage &&
            [
              "error",
              "failed",
              "failure",
            ].includes(
              status,
            ) && (
              <InfoCard
                label="Virhe"
                className="mt-4 border-red-500/20 bg-red-500/5"
              >
                <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm text-red-300">
                  {errorMessage}
                </pre>
              </InfoCard>
            )}
        </>
      )}
    </Section>
  )
}


export default CurrentSessionCard
