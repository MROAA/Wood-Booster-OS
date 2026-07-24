import InfoCard from "./InfoCard"
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


function getDisplayValue(
  status,
) {
  const normalizedStatus =
    normalizeStatus(
      status,
    )

  const labels = {
    idle: "Odottaa",
    waiting: "Odottaa",
    pending: "Odottaa",
    queued: "Jonossa",
    ready: "Valmis",
    planning: "Suunnittelee",
    processing: "Käsittelee",
    running: "Käynnissä",
    executing: "Suorittaa",
    active: "Aktiivinen",
    completed: "Valmis",
    complete: "Valmis",
    success: "Onnistui",
    succeeded: "Onnistui",
    completed_with_errors:
      "Valmis virheillä",
    failed: "Epäonnistui",
    failure: "Epäonnistui",
    error: "Virhe",
  }

  return (
    labels[
      normalizedStatus
    ] ||
    normalizedStatus
  )
}


function getProgressPercentage(
  totalCount,
  completedCount,
  failedCount,
) {
  if (
    totalCount <=
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


function StatusCard({
  title,
  description,
  status,
  value,
  secondaryValue,
}) {
  return (
    <InfoCard
      label={
        title
      }
      description={
        description
      }
      className="bg-neutral-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-2xl font-bold text-white">
            {value}
          </p>

          {secondaryValue && (
            <p className="mt-1 text-xs text-neutral-500">
              {secondaryValue}
            </p>
          )}
        </div>

        <StatusBadge
          status={
            status
          }
        />
      </div>
    </InfoCard>
  )
}


function ExecutionStatusCards({
  activityStatus = "idle",
  queueStatus = "idle",
  totalCount = 0,
  pendingCount = 0,
  runningCount = 0,
  completedCount = 0,
  failedCount = 0,
}) {
  const safeTotalCount =
    Number(
      totalCount,
    ) || 0

  const safePendingCount =
    Number(
      pendingCount,
    ) || 0

  const safeRunningCount =
    Number(
      runningCount,
    ) || 0

  const safeCompletedCount =
    Number(
      completedCount,
    ) || 0

  const safeFailedCount =
    Number(
      failedCount,
    ) || 0

  const progressPercentage =
    getProgressPercentage(
      safeTotalCount,
      safeCompletedCount,
      safeFailedCount,
    )

  const activityNormalized =
    normalizeStatus(
      activityStatus,
    )

  const queueNormalized =
    normalizeStatus(
      queueStatus,
    )

  const completedStatus =
    safeCompletedCount >
    0
      ? "completed"
      : "idle"

  const failedStatus =
    safeFailedCount >
    0
      ? "failed"
      : "idle"

  const queueSummary =
    safeTotalCount >
    0
      ? `${safeCompletedCount + safeFailedCount} / ${safeTotalCount} käsitelty`
      : "Ei toimintoja"

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="AI Session"
          description="AI Brainin nykyinen käsittelytila."
          status={
            activityNormalized
          }
          value={
            getDisplayValue(
              activityNormalized,
            )
          }
          secondaryValue="Nykyinen AI-istunto"
        />

        <StatusCard
          title="Action Queue"
          description="Toimintojonon nykyinen suoritustila."
          status={
            queueNormalized
          }
          value={
            getDisplayValue(
              queueNormalized,
            )
          }
          secondaryValue={
            queueSummary
          }
        />

        <StatusCard
          title="Completed"
          description="Onnistuneesti suoritetut toiminnot."
          status={
            completedStatus
          }
          value={
            safeCompletedCount
          }
          secondaryValue={`${progressPercentage} % jonosta käsitelty`}
        />

        <StatusCard
          title="Failed"
          description="Epäonnistuneet tai virheeseen päättyneet toiminnot."
          status={
            failedStatus
          }
          value={
            safeFailedCount
          }
          secondaryValue={
            safeFailedCount >
            0
              ? "Vaatii tarkistusta"
              : "Ei virheitä"
          }
        />
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Execution Progress
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {safeCompletedCount +
                safeFailedCount}{" "}
              / {safeTotalCount} toimintoa käsitelty
            </p>
          </div>

          <p className="text-lg font-bold text-violet-300">
            {progressPercentage} %
          </p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{
              width:
                `${progressPercentage}%`,
            }}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Odottaa
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {
                safePendingCount
              }
            </p>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Suoritetaan
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {
                safeRunningCount
              }
            </p>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Yhteensä
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {
                safeTotalCount
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}


export default ExecutionStatusCards
