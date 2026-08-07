import {
  useMemo,
} from "react"

import CapabilityPlanCard from "../components/execution/CapabilityPlanCard"
import CurrentSessionCard from "../components/execution/CurrentSessionCard"
import ExecutionHistory from "../components/execution/ExecutionHistory"
import ExecutionStatusCards from "../components/execution/ExecutionStatusCards"
import ExecutionTimeline from "../components/execution/ExecutionTimeline"
import LiveActionQueue from "../components/execution/LiveActionQueue"
import PlanningPipeline from "../components/execution/PlanningPipeline"

import {
  useAI,
} from "../context/AIContext"


const emptyActivity = {
  agent:
    "system",

  question:
    "",

  answer:
    "",

  reason:
    "",

  action:
    null,

  actions:
    [],

  plan:
    null,

  intentAnalysis:
    null,

  plannerDecision:
    null,

  executionPlan:
    null,

  actionResult:
    null,

  source:
    "",

  type:
    "",

  timestamp:
    null,

  startedAt:
    null,

  completedAt:
    null,

  status:
    "idle",
}


const emptyExecutionState = {
  status:
    "idle",

  actions:
    [],

  results:
    [],

  activeIndex:
    null,

  pendingCount:
    0,

  runningCount:
    0,

  completedCount:
    0,

  failedCount:
    0,

  totalCount:
    0,

  createdAt:
    null,

  completedAt:
    null,
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


function getActionStatus(
  queueItem,
) {
  if (
    queueItem?.result
      ?.success === true
  ) {
    return "completed"
  }

  if (
    queueItem?.result
      ?.success === false
  ) {
    return "failed"
  }

  return normalizeStatus(
    queueItem?.status ||
    queueItem?.action
      ?.status ||
    queueItem?.result
      ?.status ||
    "pending",
  )
}


function countActionsByStatus(
  actions,
  statuses,
) {
  return actions.filter(
    (action) =>
      statuses.includes(
        getActionStatus(
          action,
        ),
      ),
  ).length
}


function normalizeHistory(
  history,
) {
  return normalizeArray(
    history,
  )
    .slice()
    .sort(
      (
        firstItem,
        secondItem,
      ) => {
        const firstTime =
          new Date(
            firstItem?.timestamp ||
            firstItem?.completedAt ||
            firstItem?.createdAt ||
            0,
          ).getTime()

        const secondTime =
          new Date(
            secondItem?.timestamp ||
            secondItem?.completedAt ||
            secondItem?.createdAt ||
            0,
          ).getTime()

        return (
          secondTime -
          firstTime
        )
      },
    )
}


function normalizeExecutionState(
  executionState,
) {
  const sourceState =
    executionState ||
    {}

  const actions =
    normalizeArray(
      sourceState.actions,
    )

  const calculatedPendingCount =
    countActionsByStatus(
      actions,
      [
        "pending",
        "queued",
        "waiting",
        "ready",
      ],
    )

  const calculatedRunningCount =
    countActionsByStatus(
      actions,
      [
        "running",
        "processing",
        "executing",
        "active",
      ],
    )

  const calculatedCompletedCount =
    countActionsByStatus(
      actions,
      [
        "completed",
        "complete",
        "success",
        "succeeded",
        "done",
      ],
    )

  const calculatedFailedCount =
    countActionsByStatus(
      actions,
      [
        "failed",
        "failure",
        "error",
        "rejected",
      ],
    )

  return {
    ...emptyExecutionState,
    ...sourceState,

    status:
      normalizeStatus(
        sourceState.status,
      ),

    actions,

    results:
      normalizeArray(
        sourceState.results,
      ),

    pendingCount:
      Number.isFinite(
        Number(
          sourceState.pendingCount,
        ),
      )
        ? Number(
            sourceState.pendingCount,
          )
        : calculatedPendingCount,

    runningCount:
      Number.isFinite(
        Number(
          sourceState.runningCount,
        ),
      )
        ? Number(
            sourceState.runningCount,
          )
        : calculatedRunningCount,

    completedCount:
      Number.isFinite(
        Number(
          sourceState.completedCount,
        ),
      )
        ? Number(
            sourceState.completedCount,
          )
        : calculatedCompletedCount,

    failedCount:
      Number.isFinite(
        Number(
          sourceState.failedCount,
        ),
      )
        ? Number(
            sourceState.failedCount,
          )
        : calculatedFailedCount,

    totalCount:
      Number.isFinite(
        Number(
          sourceState.totalCount,
        ),
      ) &&
      Number(
        sourceState.totalCount,
      ) >
        0
        ? Number(
            sourceState.totalCount,
          )
        : actions.length,
  }
}


function normalizeActivity(
  activity,
) {
  const sourceActivity =
    activity ||
    {}

  return {
    ...emptyActivity,
    ...sourceActivity,

    status:
      normalizeStatus(
        sourceActivity.status,
      ),

    actions:
      normalizeArray(
        sourceActivity.actions ||
        sourceActivity.action,
      ),
  }
}


function hasMeaningfulValue(
  value,
) {
  if (!value) {
    return false
  }

  if (
    Array.isArray(
      value,
    )
  ) {
    return (
      value.length >
      0
    )
  }

  if (
    typeof value ===
    "object"
  ) {
    return (
      Object.keys(
        value,
      ).length >
      0
    )
  }

  return Boolean(
    String(
      value,
    ).trim(),
  )
}


function ExecutionCenterV2() {
  const {
    activity,
    activityHistory,
    executionState,
    isAIProcessing,
    clearAIHistory,
    clearCurrentAIExecution,
    clearAllAIData,
  } = useAI()

  const safeActivity =
    useMemo(
      () =>
        normalizeActivity(
          activity,
        ),
      [
        activity,
      ],
    )

  const safeExecutionState =
    useMemo(
      () =>
        normalizeExecutionState(
          executionState,
        ),
      [
        executionState,
      ],
    )

  const history =
    useMemo(
      () =>
        normalizeHistory(
          activityHistory,
        ),
      [
        activityHistory,
      ],
    )

  const activityStatus =
    isAIProcessing
      ? safeActivity.status ===
        "executing"
        ? "executing"
        : safeActivity.status ===
            "planning"
          ? "planning"
          : "processing"
      : safeActivity.status ||
        "idle"

  const queueStatus =
    safeExecutionState.status ||
    "idle"

  const intentAnalysis =
    safeActivity.intentAnalysis ||
    null

  const plannerDecision =
    safeActivity.plannerDecision ||
    null

  const capabilityPlan =
    safeActivity.plan ||
    null

  const executionPlan =
    safeActivity.executionPlan ||
    null

  const planningPipelineData = {
    question:
      safeActivity.question,

    intentAnalysis,

    plannerDecision,

    plan:
      capabilityPlan,

    executionPlan,

    actions:
      safeActivity.actions,
  }

  const capabilityStatus =
    capabilityPlan
      ? [
          "running",
          "processing",
          "planning",
          "executing",
        ].includes(
          activityStatus,
        )
        ? "active"
        : [
              "failed",
              "error",
              "completed_with_errors",
            ].includes(
              queueStatus,
            )
          ? "warning"
          : "ready"
      : "idle"

  const hasCurrentSession =
    activityStatus !==
      "idle" ||
    queueStatus !==
      "idle" ||
    hasMeaningfulValue(
      safeActivity.question,
    ) ||
    hasMeaningfulValue(
      safeActivity.answer,
    ) ||
    hasMeaningfulValue(
      intentAnalysis,
    ) ||
    hasMeaningfulValue(
      plannerDecision,
    ) ||
    hasMeaningfulValue(
      capabilityPlan,
    ) ||
    hasMeaningfulValue(
      executionPlan,
    ) ||
    safeActivity.actions.length >
      0 ||
    safeExecutionState.actions.length >
      0 ||
    safeExecutionState.results.length >
      0

  function handleClearCurrentSession() {
    const shouldClear =
      window.confirm(
        "Tyhjennetäänkö nykyinen AI-istunto, suunnittelutiedot ja toimintojono?",
      )

    if (!shouldClear) {
      return
    }

    clearCurrentAIExecution()
  }


  function handleClearHistory() {
    const shouldClear =
      window.confirm(
        "Tyhjennetäänkö koko tallennettu Execution History?",
      )

    if (!shouldClear) {
      return
    }

    clearAIHistory()
  }


  function handleClearAllData() {
    const shouldClear =
      window.confirm(
        "Tyhjennetäänkö nykyinen istunto, suunnittelutiedot, toimintojono ja koko suoritushistoria?",
      )

    if (!shouldClear) {
      return
    }

    clearAllAIData()
  }


  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--wood-accent)]">
              Wood-Booster AI OS
            </p>

            <h1 className="mt-2 text-4xl font-bold text-[var(--wood-text)]">
              Execution Center
            </h1>

            <p className="mt-3 max-w-2xl text-[var(--wood-muted)]">
              Seuraa AI-pyyntöä,
              intentin analysointia,
              plannerin päätöstä,
              suoritussuunnitelmaa,
              toimintojonoa ja tuloksia
              reaaliaikaisesti.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={
                  handleClearCurrentSession
                }
                disabled={
                  !hasCurrentSession
                }
                className="
                  rounded-xl
                  border
                  border-amber-500/30
                  bg-amber-500/10
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-amber-300
                  transition
                  hover:border-amber-400/50
                  hover:bg-amber-500/20
                  disabled:cursor-not-allowed
                  disabled:border-neutral-800
                  disabled:bg-neutral-950
                  disabled:text-neutral-600
                "
              >
                Tyhjennä nykyinen
              </button>

              <button
                type="button"
                onClick={
                  handleClearHistory
                }
                disabled={
                  history.length ===
                  0
                }
                className="
                  rounded-xl
                  border
                  border-red-500/30
                  bg-red-500/10
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-red-300
                  transition
                  hover:border-red-400/50
                  hover:bg-red-500/20
                  disabled:cursor-not-allowed
                  disabled:border-neutral-800
                  disabled:bg-neutral-950
                  disabled:text-neutral-600
                "
              >
                Tyhjennä historia
              </button>

              <button
                type="button"
                onClick={
                  handleClearAllData
                }
                disabled={
                  !hasCurrentSession &&
                  history.length ===
                    0
                }
                className="
                  rounded-xl
                  border
                  border-neutral-700
                  bg-neutral-950
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-neutral-300
                  transition
                  hover:border-neutral-500
                  hover:bg-neutral-800
                  disabled:cursor-not-allowed
                  disabled:border-neutral-800
                  disabled:text-neutral-600
                "
              >
                Tyhjennä kaikki
              </button>
            </div>
          </div>
        </header>

        <ExecutionStatusCards
          activityStatus={
            activityStatus
          }
          queueStatus={
            queueStatus
          }
          totalCount={
            safeExecutionState
              .totalCount
          }
          pendingCount={
            safeExecutionState
              .pendingCount
          }
          runningCount={
            safeExecutionState
              .runningCount
          }
          completedCount={
            safeExecutionState
              .completedCount
          }
          failedCount={
            safeExecutionState
              .failedCount
          }
        />

        <CurrentSessionCard
          activity={
            safeActivity
          }
        />

        <ExecutionTimeline
          activity={
            safeActivity
          }
          executionState={
            safeExecutionState
          }
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <PlanningPipeline
            plannerDecision={
              planningPipelineData
            }
            status={
              activityStatus
            }
          />

          <CapabilityPlanCard
            capabilityPlan={
              capabilityPlan
            }
            status={
              capabilityStatus
            }
          />
        </div>

        <LiveActionQueue
          actions={
            safeExecutionState
              .actions
          }
          queue={
            safeExecutionState
          }
          results={
            safeExecutionState
              .results
          }
          status={
            queueStatus
          }
        />

        <ExecutionHistory
          history={
            history
          }
        />
    </div>
  )
}


export default ExecutionCenterV2
