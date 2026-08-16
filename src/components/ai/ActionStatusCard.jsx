/*
 * Näyttää AI:n suorittamien toimintojen (create_project, navigate,
 * jne. - ks. src/services/aiActionDispatcher.js) tilan. Jaettu
 * komponentti - alun perin ProjectAIChat.jsx:n oma, nyt myös
 * ChatPanel.jsx:n käytössä, jotta sama "AI suorittaa toimintoa" /
 * "✓ AI-toiminto suoritettu" -kortti näyttää samalta kaikkialla
 * eikä synny kahta hieman erilaista toteutusta.
 */
function ActionStatusCard({
  status,
}) {
  const type =
    status?.type ||
    "running"

  const className =
    type === "success"
      ? "border-green-900 bg-green-950/40 text-green-200"
      : type === "error"
        ? "border-red-900 bg-red-950/40 text-red-200"
        : "border-[var(--wood-accent)] bg-[var(--wood-accent)]/10 text-[var(--wood-accent)]"

  const title =
    type === "success"
      ? "✓ AI-toiminto suoritettu"
      : type === "error"
        ? "AI-toiminto epäonnistui"
        : "AI suorittaa toimintoa"

  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
    >

      <p className="font-semibold">
        {title}
      </p>

      <p className="mt-2 text-sm">
        {status?.message ||
          "Käsitellään toimintoa..."}
      </p>

    </div>
  )
}


function createActionStartMessage(
  action,
) {
  const actionType =
    String(
      action?.type ||
      "",
    )
      .trim()
      .toLowerCase()

  if (
    actionType ===
    "open_project_tab"
  ) {
    return `Avataan projektin välilehti: ${
      action?.tab ||
      action?.payload?.tab ||
      "tuntematon"
    }.`
  }

  if (
    actionType ===
    "create_project"
  ) {
    return "Luodaan uutta projektia."
  }

  return `Suoritetaan AI-toimintoa: ${
    actionType ||
    "tuntematon"
  }.`
}


function createQueueResultMessage(
  queueResult,
) {
  if (!queueResult) {
    return (
      "AI-toimintojen tulosta ei saatu."
    )
  }

  if (queueResult.message) {
    return queueResult.message
  }

  const results =
    Array.isArray(
      queueResult.results,
    )
      ? queueResult.results
      : []

  const successfulCount =
    results.filter(
      (result) =>
        result?.success,
    ).length

  const failedCount =
    results.length -
    successfulCount

  if (
    successfulCount > 0 &&
    failedCount === 0
  ) {
    return `${successfulCount} AI-toimintoa suoritettiin onnistuneesti.`
  }

  if (
    successfulCount > 0 &&
    failedCount > 0
  ) {
    return `${successfulCount} toimintoa onnistui ja ${failedCount} epäonnistui.`
  }

  if (failedCount > 0) {
    return `${failedCount} AI-toimintoa epäonnistui.`
  }

  return "AI ei palauttanut suoritettavia toimintoja."
}


export default ActionStatusCard

export {
  createActionStartMessage,
  createQueueResultMessage,
}
