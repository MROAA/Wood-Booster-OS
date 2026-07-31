import InfoCard from "./InfoCard"
import StatusBadge from "./StatusBadge"


function normalizeStatus(
  status,
) {
  return String(
    status ||
    "unknown",
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
  )
}


function formatDuration(
  startedAt,
  completedAt,
  duration,
) {
  const numericDuration =
    Number(
      duration,
    )

  if (
    Number.isFinite(
      numericDuration,
    ) &&
    numericDuration >=
      0
  ) {
    if (
      numericDuration <
      1000
    ) {
      return `${Math.round(
        numericDuration,
      )} ms`
    }

    return `${(
      numericDuration /
      1000
    ).toFixed(
      2,
    )} s`
  }

  if (
    !startedAt ||
    !completedAt
  ) {
    return "-"
  }

  const startTime =
    new Date(
      startedAt,
    ).getTime()

  const endTime =
    new Date(
      completedAt,
    ).getTime()

  if (
    Number.isNaN(
      startTime,
    ) ||
    Number.isNaN(
      endTime,
    ) ||
    endTime <
      startTime
  ) {
    return "-"
  }

  const difference =
    endTime -
    startTime

  if (
    difference <
    1000
  ) {
    return `${difference} ms`
  }

  return `${(
    difference /
    1000
  ).toFixed(
    2,
  )} s`
}


function getResultStatus(
  result,
) {
  if (
    result?.success ===
      true ||
    result?.result
      ?.success === true
  ) {
    return "completed"
  }

  if (
    result?.success ===
      false ||
    result?.result
      ?.success === false
  ) {
    return "failed"
  }

  return normalizeStatus(
    result?.status ||
    result?.result
      ?.status ||
    result?.output
      ?.status ||
    "unknown",
  )
}


function getResultTitle(
  result,
  index,
) {
  const actionValue =
    result?.action

  if (
    typeof actionValue ===
    "string"
  ) {
    return actionValue
  }

  return (
    result?.label ||
    result?.title ||
    result?.name ||
    actionValue?.label ||
    actionValue?.name ||
    actionValue?.type ||
    result?.actionType ||
    result?.type ||
    `Toiminto ${index + 1}`
  )
}


function getResultType(
  result,
) {
  return (
    result?.type ||
    result?.actionType ||
    result?.action?.type ||
    result?.result
      ?.type ||
    ""
  )
}


function getResultMessage(
  result,
) {
  return (
    result?.message ||
    result?.result
      ?.message ||
    result?.output
      ?.message ||
    result?.data
      ?.message ||
    ""
  )
}


function getResultError(
  result,
) {
  const error =
    result?.error ||
    result?.result
      ?.error ||
    result?.output
      ?.error

  if (!error) {
    return ""
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


function getResultData(
  result,
) {
  return (
    result?.data ||
    result?.output ||
    result?.result
      ?.data ||
    result?.result
      ?.output ||
    null
  )
}


function getPayload(
  result,
) {
  return (
    result?.payload ||
    result?.action
      ?.payload ||
    result?.input ||
    result?.request ||
    null
  )
}


function stringifyValue(
  value,
) {
  if (
    typeof value ===
    "string"
  ) {
    return value
  }

  try {
    return JSON.stringify(
      value,
      null,
      2,
    )
  } catch {
    return String(
      value,
    )
  }
}


function ActionResultCard({
  result,
  index = 0,
}) {
  const safeResult =
    result ||
    {}

  const status =
    getResultStatus(
      safeResult,
    )

  const title =
    getResultTitle(
      safeResult,
      index,
    )

  const type =
    getResultType(
      safeResult,
    )

  const message =
    getResultMessage(
      safeResult,
    )

  const error =
    getResultError(
      safeResult,
    )

  const resultData =
    getResultData(
      safeResult,
    )

  const payload =
    getPayload(
      safeResult,
    )

  const startedAt =
    safeResult.startedAt ||
    safeResult.startTime ||
    safeResult.createdAt ||
    null

  const completedAt =
    safeResult.completedAt ||
    safeResult.finishedAt ||
    safeResult.endTime ||
    safeResult.updatedAt ||
    safeResult.timestamp ||
    null

  const duration =
    formatDuration(
      startedAt,
      completedAt,
      safeResult.duration ||
      safeResult.durationMs ||
      safeResult.executionTime,
    )

  const actionId =
    safeResult.actionId ||
    safeResult.id ||
    safeResult.action?.id ||
    "-"

  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-bold text-violet-300">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="break-words font-semibold text-white">
                {title}
              </h3>

              {type && (
                <p className="mt-1 break-words text-xs uppercase tracking-wider text-neutral-500">
                  {type}
                </p>
              )}
            </div>

            <StatusBadge
              status={
                status
              }
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Status"
              value={
                status
              }
            />

            <InfoCard
              label="Action ID"
              value={
                actionId
              }
            />

            <InfoCard
              label="Kesto"
              value={
                duration
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
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
          </div>

          {message && (
            <InfoCard
              label="Tulos"
              className="mt-3 border-emerald-500/20 bg-emerald-500/5"
            >
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-300">
                {message}
              </p>
            </InfoCard>
          )}

          {error && (
            <InfoCard
              label="Virhe"
              className="mt-3 border-red-500/20 bg-red-500/5"
            >
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-red-300">
                {error}
              </pre>
            </InfoCard>
          )}

          {payload && (
            <InfoCard
              label="Payload"
              className="mt-3"
            >
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-neutral-300">
                {stringifyValue(
                  payload,
                )}
              </pre>
            </InfoCard>
          )}

          {resultData && (
            <InfoCard
              label="Palautettu data"
              className="mt-3"
            >
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-neutral-300">
                {stringifyValue(
                  resultData,
                )}
              </pre>
            </InfoCard>
          )}
        </div>
      </div>
    </article>
  )
}


export default ActionResultCard
