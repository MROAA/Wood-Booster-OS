import {
  useNavigate,
} from "react-router-dom"

import {
  useAI,
} from "../../context/AIContext"

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


function getStatusLabel(
  status,
) {
  const labels = {
    idle:
      "Valmiina",

    pending:
      "Odottaa",

    processing:
      "Käsitellään",

    planning:
      "Suunnitellaan",

    executing:
      "Suoritetaan",

    running:
      "Suoritetaan",

    completed:
      "Valmis",

    success:
      "Valmis",

    failed:
      "Virhe",

    error:
      "Virhe",

    completed_with_errors:
      "Valmis virhein",
  }

  return (
    labels[status] ||
    status
  )
}


function getIntent(
  activity,
) {
  return (
    activity
      ?.intentAnalysis
      ?.primaryIntent ||
    activity
      ?.intentAnalysis
      ?.intent ||
    activity
      ?.plannerDecision
      ?.intent ||
    "Ei analysoitu"
  )
}


function getCapability(
  activity,
) {
  return (
    activity
      ?.plannerDecision
      ?.capability ||
    "Ei valittu"
  )
}


function getConfidence(
  activity,
) {
  const confidence =
    activity
      ?.plannerDecision
      ?.confidence

  if (
    typeof confidence !==
    "number"
  ) {
    return null
  }

  return Math.round(
    confidence * 100,
  )
}


function getActionStatus(
  item,
) {
  if (
    item?.result
      ?.success === true
  ) {
    return "completed"
  }

  if (
    item?.result
      ?.success === false
  ) {
    return "failed"
  }

  return normalizeStatus(
    item?.status ||
    item?.action
      ?.status ||
    "pending",
  )
}


function getActionLabel(
  item,
  index,
) {
  const action =
    item?.action ||
    item

  return (
    action?.label ||
    action?.name ||
    action?.projectName ||
    action?.customerName ||
    action?.path ||
    action?.type ||
    `Toiminto ${index + 1}`
  )
}


function WorkspaceExecutionPanel() {
  const navigate =
    useNavigate()

  const {
    activity,
    executionState,
    isAIProcessing,
  } = useAI()

  const safeActivity =
    activity ||
    {}

  const safeExecutionState =
    executionState ||
    {}

  const activityStatus =
    normalizeStatus(
      isAIProcessing
        ? safeActivity.status ||
          "processing"
        : safeActivity.status ||
          "idle",
    )

  const queueStatus =
    normalizeStatus(
      safeExecutionState
        .status ||
      "idle",
    )

  const actions =
    normalizeArray(
      safeExecutionState
        .actions,
    )

  const visibleActions =
    actions.slice(
      0,
      4,
    )

  const question =
    String(
      safeActivity
        .question ||
      "",
    ).trim()

  const confidence =
    getConfidence(
      safeActivity,
    )

  const hasSession =
    question ||
    activityStatus !==
      "idle" ||
    queueStatus !==
      "idle" ||
    actions.length >
      0

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <header className="flex items-start justify-between gap-4 border-b border-neutral-800 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              ⚡
            </span>

            <h2 className="text-lg font-semibold text-white">
              Live Execution
            </h2>
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            AI Brainin nykyinen suoritus.
          </p>
        </div>

        <StatusBadge
          status={
            activityStatus
          }
          label={
            getStatusLabel(
              activityStatus,
            )
          }
        />
      </header>

      {!hasSession && (
        <div className="p-5">
          <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-5 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-xl">
              ○
            </div>

            <p className="mt-3 font-medium text-neutral-300">
              Ei aktiivista istuntoa
            </p>

            <p className="mt-1 text-sm leading-5 text-neutral-600">
              Lähetä AI Brainille viesti tai komento.
            </p>
          </div>
        </div>
      )}

      {hasSession && (
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Nykyinen pyyntö
            </p>

            <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-300">
              {question ||
                "AI-istunto on käynnissä."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs text-neutral-600">
                Intent
              </p>

              <p className="mt-1 truncate text-sm font-medium text-violet-300">
                {String(
                  getIntent(
                    safeActivity,
                  ),
                )}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs text-neutral-600">
                Capability
              </p>

              <p className="mt-1 truncate text-sm font-medium text-cyan-300">
                {String(
                  getCapability(
                    safeActivity,
                  ),
                )}
              </p>
            </div>
          </div>

          {confidence !==
            null && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-neutral-500">
                  Planner confidence
                </p>

                <p className="text-sm font-semibold text-emerald-400">
                  {confidence} %
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width:
                      `${confidence}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  Action Queue
                </p>

                <p className="mt-1 text-xs text-neutral-600">
                  {actions.length} toimintoa
                </p>
              </div>

              <StatusBadge
                status={
                  queueStatus
                }
                label={
                  getStatusLabel(
                    queueStatus,
                  )
                }
              />
            </div>

            {visibleActions.length ===
              0 && (
              <p className="mt-4 text-sm text-neutral-600">
                Ei jonossa olevia toimintoja.
              </p>
            )}

            {visibleActions.length >
              0 && (
              <div className="mt-4 space-y-2">
                {visibleActions.map(
                  (
                    item,
                    index,
                  ) => {
                    const status =
                      getActionStatus(
                        item,
                      )

                    return (
                      <div
                        key={
                          item?.id ||
                          item?.action
                            ?.id ||
                          `workspace-action-${index}`
                        }
                        className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-xs font-bold text-neutral-400">
                          {index + 1}
                        </span>

                        <p className="min-w-0 flex-1 truncate text-xs text-neutral-300">
                          {getActionLabel(
                            item,
                            index,
                          )}
                        </p>

                        <StatusBadge
                          status={
                            status
                          }
                          label={
                            getStatusLabel(
                              status,
                            )
                          }
                        />
                      </div>
                    )
                  },
                )}
              </div>
            )}

            {actions.length >
              visibleActions.length && (
              <p className="mt-3 text-xs text-neutral-600">
                Lisäksi{" "}
                {actions.length -
                  visibleActions.length}{" "}
                toimintoa.
              </p>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-neutral-800 p-4">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/execution",
            )
          }
          className="flex w-full items-center justify-between rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm font-semibold text-neutral-300 transition hover:border-violet-500/50 hover:bg-neutral-800 hover:text-white"
        >
          <span>
            Avaa Execution Center
          </span>

          <span className="text-violet-400">
            →
          </span>
        </button>
      </footer>
    </section>
  )
}


export default WorkspaceExecutionPanel
