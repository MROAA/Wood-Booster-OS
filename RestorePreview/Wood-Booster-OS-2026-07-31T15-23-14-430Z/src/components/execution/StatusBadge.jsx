function normalizeStatus(
  status,
) {
  return String(
    status ||
    "unknown",
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      "_",
    )
}


function getStatusLabel(
  status,
) {
  const normalizedStatus =
    normalizeStatus(
      status,
    )

  const labels = {
    idle:
      "Odottaa",

    waiting:
      "Odottaa",

    pending:
      "Odottaa",

    queued:
      "Jonossa",

    planning:
      "Suunnittelee",

    processing:
      "Käsittelee",

    executing:
      "Suorittaa",

    running:
      "Käynnissä",

    active:
      "Aktiivinen",

    completed:
      "Valmis",

    complete:
      "Valmis",

    done:
      "Valmis",

    success:
      "Onnistui",

    succeeded:
      "Onnistui",

    completed_with_errors:
      "Valmis virheillä",

    warning:
      "Varoitus",

    failed:
      "Epäonnistui",

    failure:
      "Epäonnistui",

    error:
      "Virhe",

    rejected:
      "Hylätty",

    skipped:
      "Ohitettu",

    cancelled:
      "Peruutettu",

    canceled:
      "Peruutettu",

    empty:
      "Tyhjä",

    ready:
      "Valmis",

    offline:
      "Offline",

    online:
      "Online",

    unknown:
      "Tuntematon",
  }

  return (
    labels[
      normalizedStatus
    ] ||
    normalizedStatus ||
    "Tuntematon"
  )
}


function getStatusClasses(
  status,
) {
  const normalizedStatus =
    normalizeStatus(
      status,
    )

  const successStatuses = [
    "completed",
    "complete",
    "done",
    "success",
    "succeeded",
    "ready",
    "online",
  ]

  const errorStatuses = [
    "failed",
    "failure",
    "error",
    "rejected",
    "offline",
  ]

  const warningStatuses = [
    "warning",
    "completed_with_errors",
  ]

  const activeStatuses = [
    "planning",
    "processing",
    "executing",
    "running",
    "active",
  ]

  const queuedStatuses = [
    "waiting",
    "queued",
    "pending",
  ]

  const neutralStatuses = [
    "idle",
    "empty",
    "unknown",
  ]

  const skippedStatuses = [
    "skipped",
    "cancelled",
    "canceled",
  ]

  if (
    successStatuses.includes(
      normalizedStatus,
    )
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  }

  if (
    errorStatuses.includes(
      normalizedStatus,
    )
  ) {
    return "border-red-500/30 bg-red-500/10 text-red-300"
  }

  if (
    warningStatuses.includes(
      normalizedStatus,
    )
  ) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300"
  }

  if (
    activeStatuses.includes(
      normalizedStatus,
    )
  ) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300"
  }

  if (
    queuedStatuses.includes(
      normalizedStatus,
    )
  ) {
    return "border-violet-500/30 bg-violet-500/10 text-violet-300"
  }

  if (
    skippedStatuses.includes(
      normalizedStatus,
    )
  ) {
    return "border-sky-500/30 bg-sky-500/10 text-sky-300"
  }

  if (
    neutralStatuses.includes(
      normalizedStatus,
    )
  ) {
    return "border-neutral-700 bg-neutral-800 text-neutral-400"
  }

  return "border-neutral-700 bg-neutral-800 text-neutral-300"
}


function StatusBadge({
  status = "idle",
  children,
  className = "",
}) {
  const normalizedStatus =
    normalizeStatus(
      status,
    )

  return (
    <span
      title={
        getStatusLabel(
          normalizedStatus,
        )
      }
      className={`
        inline-flex
        shrink-0
        items-center
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-semibold
        ${getStatusClasses(
          normalizedStatus,
        )}
        ${className}
      `}
    >
      {children ??
        getStatusLabel(
          normalizedStatus,
        )}
    </span>
  )
}


export {
  getStatusClasses,
  getStatusLabel,
  normalizeStatus,
}


export default StatusBadge
