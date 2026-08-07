import ActionResultCard from "./ActionResultCard"
import InfoCard from "./InfoCard"
import Section from "./Section"
import StatusBadge from "./StatusBadge"


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
  value,
) {
  if (!value) {
    return "-"
  }

  const date =
    new Date(
      value,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return String(
      value,
    )
  }

  return date.toLocaleTimeString(
    "fi-FI",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      second:
        "2-digit",
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


function getActionData(
  queueItem,
) {
  return (
    queueItem?.action ||
    queueItem ||
    {}
  )
}


function getActionStatus(
  queueItem,
) {
  const action =
    getActionData(
      queueItem,
    )

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
    action?.status ||
    queueItem?.result
      ?.status ||
    "pending",
  )
}


function getActionLabel(
  queueItem,
  index,
) {
  const action =
    getActionData(
      queueItem,
    )

  if (
    typeof action ===
    "string"
  ) {
    return action
  }

  return (
    action?.label ||
    action?.name ||
    action?.title ||
    action?.command ||
    action?.type ||
    `Toiminto ${index + 1}`
  )
}


function getActionType(
  queueItem,
) {
  const action =
    getActionData(
      queueItem,
    )

  if (
    typeof action ===
    "string"
  ) {
    return ""
  }

  return (
    action?.type ||
    queueItem?.type ||
    ""
  )
}


function getActionDescription(
  queueItem,
) {
  const action =
    getActionData(
      queueItem,
    )

  if (
    typeof action ===
    "string"
  ) {
    return ""
  }

  return (
    action?.description ||
    queueItem?.description ||
    ""
  )
}


function getActionPayload(
  queueItem,
) {
  const action =
    getActionData(
      queueItem,
    )

  return (
    action?.payload ||
    action?.params ||
    action?.data ||
    queueItem?.payload ||
    null
  )
}


function getActionError(
  queueItem,
) {
  return (
    queueItem?.error ||
    queueItem?.result
      ?.error ||
    null
  )
}


function getResultMessage(
  queueItem,
) {
  return (
    queueItem?.result
      ?.message ||
    queueItem?.message ||
    ""
  )
}


function countActionsByStatuses(
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


function getProgressPercentage(
  totalCount,
  completedCount,
  failedCount,
) {
  if (
    totalCount ===
    0
  ) {
    return 0
  }

  const finishedCount =
    completedCount +
    failedCount

  return Math.min(
    100,
    Math.round(
      (
        finishedCount /
        totalCount
      ) *
        100,
    ),
  )
}


function getCurrentActionIndex(
  actions,
) {
  return actions.findIndex(
    (action) =>
      [
        "running",
        "processing",
        "executing",
        "active",
      ].includes(
        getActionStatus(
          action,
        ),
      ),
  )
}


function ActionQueueItem({
  queueItem,
  index,
  isCurrent,
}) {
  const actionStatus =
    getActionStatus(
      queueItem,
    )

  const actionLabel =
    getActionLabel(
      queueItem,
      index,
    )

  const actionType =
    getActionType(
      queueItem,
    )

  const description =
    getActionDescription(
      queueItem,
    )

  const payload =
    getActionPayload(
      queueItem,
    )

  const error =
    getActionError(
      queueItem,
    )

  const resultMessage =
    getResultMessage(
      queueItem,
    )

  const startedAt =
    queueItem?.startedAt ||
    null

  const completedAt =
    queueItem?.completedAt ||
    null

  const result =
    queueItem?.result ||
    null

  return (
    <article
      className={`
        rounded-xl
        border
        p-4
        ${
          isCurrent
            ? "border-violet-500/50 bg-violet-500/5"
            : "border-neutral-800 bg-neutral-950"
        }
      `}
    >
      <div className="flex items-start gap-4">
        <span
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-full
            text-sm
            font-bold
            ${
              isCurrent
                ? "bg-violet-500/25 text-violet-200"
                : "bg-violet-500/10 text-violet-300"
            }
          `}
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words font-semibold text-white">
                  {actionLabel}
                </h3>

                {isCurrent && (
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs font-semibold text-violet-300">
                    Nykyinen toiminto
                  </span>
                )}
              </div>

              {actionType && (
                <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                  {actionType}
                </p>
              )}
            </div>

            <StatusBadge
              status={
                actionStatus
              }
            />
          </div>

          {description && (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-400">
              {description}
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoCard
              label="Käynnistyi"
              value={
                formatTimestamp(
                  startedAt,
                )
              }
            />

            <InfoCard
              label="Valmistui"
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
          </div>

          {resultMessage && (
            <InfoCard
              label="Tulos"
              className="mt-3"
            >
              <p className="whitespace-pre-wrap break-words text-sm text-neutral-300">
                {resultMessage}
              </p>
            </InfoCard>
          )}

          {payload && (
            <InfoCard
              label="Payload"
              className="mt-3"
            >
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-neutral-300">
                {JSON.stringify(
                  payload,
                  null,
                  2,
                )}
              </pre>
            </InfoCard>
          )}

          {error && (
            <InfoCard
              label="Virhe"
              className="mt-3 border-red-500/20 bg-red-500/5"
            >
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm text-red-300">
                {typeof error ===
                "string"
                  ? error
                  : error?.message ||
                    JSON.stringify(
                      error,
                      null,
                      2,
                    )}
              </pre>
            </InfoCard>
          )}

          {result && (
            <div className="mt-3">
              <ActionResultCard
                result={
                  result
                }
                index={
                  index
                }
              />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}


function LiveActionQueue({
  actions,
  queue,
  results,
  status = "idle",
}) {
  const queueActions =
    normalizeItems(
      actions ||
      queue?.actions ||
      queue,
    )

  const queueResults =
    normalizeItems(
      results ||
      queue?.results,
    )

  const queueStatus =
    normalizeStatus(
      queue?.status ||
      status,
    )

  const pendingCount =
    countActionsByStatuses(
      queueActions,
      [
        "pending",
        "queued",
        "waiting",
        "ready",
      ],
    )

  const runningCount =
    countActionsByStatuses(
      queueActions,
      [
        "running",
        "processing",
        "executing",
        "active",
      ],
    )

  const completedCount =
    countActionsByStatuses(
      queueActions,
      [
        "completed",
        "complete",
        "success",
        "succeeded",
        "done",
      ],
    )

  const failedCount =
    countActionsByStatuses(
      queueActions,
      [
        "failed",
        "failure",
        "error",
        "rejected",
      ],
    )

  const totalCount =
    queueActions.length

  const progressPercentage =
    getProgressPercentage(
      totalCount,
      completedCount,
      failedCount,
    )

  const currentActionIndex =
    getCurrentActionIndex(
      queueActions,
    )

  const currentAction =
    currentActionIndex >=
    0
      ? queueActions[
          currentActionIndex
        ]
      : null

  return (
    <Section
      title="Live Action Queue"
      description="Näyttää toimintojonon etenemisen, nykyisen toiminnon, ajat ja jokaisen toiminnon tuloksen."
      action={
        <StatusBadge
          status={
            queueStatus
          }
        >
          {progressPercentage} %
        </StatusBadge>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <InfoCard
          label="Yhteensä"
          value={
            totalCount
          }
        />

        <InfoCard
          label="Odottaa"
          value={
            pendingCount
          }
        />

        <InfoCard
          label="Suoritetaan"
          value={
            runningCount
          }
        />

        <InfoCard
          label="Valmis"
          value={
            completedCount
          }
        />

        <InfoCard
          label="Epäonnistui"
          value={
            failedCount
          }
        />
      </div>

      <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Current Action
        </p>

        {currentAction ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-white">
                {getActionLabel(
                  currentAction,
                  currentActionIndex,
                )}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Toiminto{" "}
                {currentActionIndex +
                  1}{" "}
                / {totalCount}
              </p>
            </div>

            <StatusBadge status="running">
              Suoritetaan
            </StatusBadge>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Yhtään toimintoa ei suoriteta juuri nyt.
          </p>
        )}
      </div>

      {queueActions.length ===
      0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-6 text-center">
          <p className="text-sm text-neutral-500">
            Toimintojono on tyhjä.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {queueActions.map(
            (
              queueItem,
              index,
            ) => (
              <ActionQueueItem
                key={
                  queueItem?.id ||
                  queueItem?.actionId ||
                  queueItem?.action
                    ?.id ||
                  `queue-action-${index}`
                }
                queueItem={
                  queueItem
                }
                index={
                  index
                }
                isCurrent={
                  index ===
                  currentActionIndex
                }
              />
            ),
          )}
        </div>
      )}

      {queueResults.length >
        0 && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">
                Action Results
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                Action Queuen erilliseen tuloslistaan tallennetut tulokset.
              </p>
            </div>

            <StatusBadge status="completed">
              {
                queueResults.length
              }
            </StatusBadge>
          </div>

          <div className="space-y-3">
            {queueResults.map(
              (
                result,
                index,
              ) => (
                <ActionResultCard
                  key={
                    result?.id ||
                    result?.actionId ||
                    `queue-result-${index}`
                  }
                  result={
                    result
                  }
                  index={
                    index
                  }
                />
              ),
            )}
          </div>
        </div>
      )}
    </Section>
  )
}


export default LiveActionQueue
