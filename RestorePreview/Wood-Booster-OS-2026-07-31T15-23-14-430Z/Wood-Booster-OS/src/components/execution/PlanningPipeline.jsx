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
  const confidence =
    Number(
      value,
    )

  if (
    !Number.isFinite(
      confidence,
    )
  ) {
    return "-"
  }

  const percentage =
    confidence <= 1
      ? confidence * 100
      : confidence

  return `${Math.round(
    percentage,
  )} %`
}


function getCapabilityLabel(
  capability,
) {
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


function getIntentLabel(
  intentAnalysis,
  plannerDecision,
) {
  return (
    intentAnalysis?.primaryIntent ||
    intentAnalysis?.intent ||
    intentAnalysis?.type ||
    plannerDecision?.intent ||
    "unknown"
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


function getExecutionStepLabel(
  step,
  index,
) {
  if (
    typeof step ===
    "string"
  ) {
    return step
  }

  return (
    step?.label ||
    step?.name ||
    step?.command ||
    step?.action?.label ||
    step?.action?.name ||
    step?.action?.type ||
    step?.type ||
    `Vaihe ${index + 1}`
  )
}


function getStepStatus({
  hasData,
  pipelineStatus,
  fallbackStatus,
}) {
  if (
    hasData
  ) {
    return "completed"
  }

  if (
    [
      "failed",
      "failure",
      "error",
      "rejected",
    ].includes(
      pipelineStatus,
    )
  ) {
    return "failed"
  }

  if (
    [
      "processing",
      "planning",
      "running",
      "executing",
      "active",
    ].includes(
      pipelineStatus,
    )
  ) {
    return fallbackStatus
  }

  return "waiting"
}


function PipelineStep({
  number,
  title,
  description,
  status,
  isLast = false,
  children,
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-sm font-bold text-neutral-300">
          {number}
        </div>

        {!isLast && (
          <div className="mt-2 h-full min-h-8 w-px bg-neutral-800" />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-sm text-neutral-500">
                {description}
              </p>
            )}
          </div>

          <StatusBadge
            status={
              normalizeStatus(
                status,
              )
            }
          />
        </div>

        {children && (
          <div className="mt-3">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}


function PlanningPipeline({
  plannerDecision,
  plan,
  status = "idle",
}) {
  const pipelineData =
    plannerDecision ||
    {}

  const intentAnalysis =
    pipelineData.intentAnalysis ||
    null

  const decision =
    pipelineData.plannerDecision ||
    plan ||
    (
      pipelineData.intent ||
      pipelineData.capability ||
      pipelineData.capabilityId
        ? pipelineData
        : null
    )

  const executionPlan =
    pipelineData.executionPlan ||
    null

  const question =
    pipelineData.question ||
    ""

  const plannedActions =
    normalizeArray(
      decision?.actions ||
      pipelineData.actions,
    )

  const executionSteps =
    normalizeArray(
      executionPlan?.steps ||
      executionPlan,
    )

  const pipelineStatus =
    normalizeStatus(
      status ||
      decision?.status ||
      executionPlan?.status,
    )

  const intent =
    getIntentLabel(
      intentAnalysis,
      decision,
    )

  const capability =
    decision?.capability ||
    decision?.capabilityId ||
    decision?.selectedCapability ||
    null

  const confidence =
    intentAnalysis?.confidence ??
    decision?.confidence

  const source =
    decision?.source ||
    intentAnalysis?.source ||
    "-"

  const hasRequest =
    Boolean(
      String(
        question,
      ).trim(),
    )

  const hasIntent =
    Boolean(
      intentAnalysis ||
      (
        intent &&
        intent !==
          "unknown"
      ),
    )

  const hasDecision =
    Boolean(
      decision,
    )

  const hasExecutionPlan =
    executionSteps.length >
      0 ||
    Boolean(
      executionPlan,
    )

  const hasPlanningData =
    hasRequest ||
    hasIntent ||
    hasDecision ||
    hasExecutionPlan ||
    plannedActions.length >
      0

  const requestStatus =
    getStepStatus({
      hasData:
        hasRequest,

      pipelineStatus,

      fallbackStatus:
        "active",
    })

  const intentStatus =
    getStepStatus({
      hasData:
        hasIntent,

      pipelineStatus,

      fallbackStatus:
        hasRequest
          ? "active"
          : "waiting",
    })

  const decisionStatus =
    getStepStatus({
      hasData:
        hasDecision,

      pipelineStatus,

      fallbackStatus:
        hasIntent
          ? "active"
          : "waiting",
    })

  const executionPlanStatus =
    getStepStatus({
      hasData:
        hasExecutionPlan,

      pipelineStatus,

      fallbackStatus:
        hasDecision
          ? "active"
          : "waiting",
    })

  return (
    <Section
      title="Planning Pipeline"
      description="Näyttää, kuinka käyttäjän pyyntö muuttuu analyysiksi, plannerin päätökseksi ja suoritussuunnitelmaksi."
      action={
        <StatusBadge
          status={
            pipelineStatus
          }
        />
      }
    >
      {!hasPlanningData ? (
        <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-6 text-center">
          <p className="text-sm text-neutral-500">
            Suunnittelutietoja ei ole vielä muodostettu.
          </p>
        </div>
      ) : (
        <div>
          <PipelineStep
            number="1"
            title="AI Request"
            description="Käyttäjän AI Brainille lähettämä pyyntö."
            status={
              requestStatus
            }
          >
            <InfoCard
              label="Käyttäjän pyyntö"
            >
              {hasRequest ? (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-300">
                  {question}
                </p>
              ) : (
                <p className="text-sm text-neutral-500">
                  Pyyntöä ei ole tallennettu.
                </p>
              )}
            </InfoCard>
          </PipelineStep>

          <PipelineStep
            number="2"
            title="Intent Analysis"
            description="AI tunnistaa pyynnön tarkoituksen ja arvioi analyysin varmuuden."
            status={
              intentStatus
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                label="Tunnistettu intent"
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
                label="Analyysin lähde"
                value={
                  intentAnalysis?.source ||
                  source
                }
              />

              <InfoCard
                label="Analyysin tila"
                value={
                  intentAnalysis?.status ||
                  intentStatus
                }
              />
            </div>
          </PipelineStep>

          <PipelineStep
            number="3"
            title="Planner Decision"
            description="Planner valitsee pyynnölle kyvykkyyden ja muodostaa suoritettavat toiminnot."
            status={
              decisionStatus
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                label="Capability"
                value={
                  getCapabilityLabel(
                    capability,
                  )
                }
              />

              <InfoCard
                label="Päätöksen lähde"
                value={
                  source
                }
              />

              <InfoCard
                label="Intent"
                value={
                  decision?.intent ||
                  intent
                }
              />

              <InfoCard
                label="Toimintojen määrä"
                value={
                  plannedActions.length
                }
              />
            </div>

            {plannedActions.length >
              0 && (
              <div className="mt-3 space-y-2">
                {plannedActions.map(
                  (
                    action,
                    index,
                  ) => (
                    <div
                      key={
                        action?.id ||
                        action?.actionId ||
                        `planner-action-${index}`
                      }
                      className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="break-words text-sm text-neutral-300">
                          {getActionLabel(
                            action,
                            index,
                          )}
                        </p>

                        {action?.type && (
                          <p className="mt-1 text-xs text-neutral-500">
                            Tyyppi:{" "}
                            {action.type}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </PipelineStep>

          <PipelineStep
            number="4"
            title="Execution Plan"
            description="Plannerin päätös muunnetaan Action Queuen suoritettaviksi vaiheiksi."
            status={
              executionPlanStatus
            }
            isLast
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                label="Suunnitelman vaiheet"
                value={
                  executionSteps.length ||
                  plannedActions.length
                }
              />

              <InfoCard
                label="Suunnitelman tila"
                value={
                  executionPlan?.status ||
                  executionPlanStatus
                }
              />
            </div>

            {executionSteps.length ===
            0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-4">
                <p className="text-sm text-neutral-500">
                  Varsinaista execution plania ei ole vielä muodostettu.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {executionSteps.map(
                  (
                    step,
                    index,
                  ) => (
                    <div
                      key={
                        step?.id ||
                        step?.stepId ||
                        `execution-step-${index}`
                      }
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-300">
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium text-neutral-300">
                            {getExecutionStepLabel(
                              step,
                              index,
                            )}
                          </p>

                          {normalizeArray(
                            step?.dependsOn,
                          ).length >
                            0 && (
                            <p className="mt-1 text-xs text-neutral-500">
                              Riippuu vaiheista:{" "}
                              {normalizeArray(
                                step.dependsOn,
                              ).join(
                                ", ",
                              )}
                            </p>
                          )}

                          {step?.status && (
                            <div className="mt-2">
                              <StatusBadge
                                status={
                                  step.status
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </PipelineStep>
        </div>
      )}
    </Section>
  )
}


export default PlanningPipeline
