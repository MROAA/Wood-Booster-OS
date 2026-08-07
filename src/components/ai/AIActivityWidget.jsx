import {
  useMemo,
} from "react"

import {
  useAI,
} from "../../context/AIContext"

function formatAgentName(agent) {
  const names = {
    system: "System",
    workshop: "Workshop Agent",
    product: "Product Agent",
    pricing: "Pricing Agent",
    marketing: "Marketing Agent",
    crm: "CRM Agent",
    development: "Developer Agent",
  }

  return (
    names[agent] ||
    agent ||
    "AI Brain"
  )
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "Ei tapahtumia"
  }

  const date = new Date(timestamp)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Tuntematon aika"
  }

  return new Intl.DateTimeFormat(
    "fi-FI",
    {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "numeric",
    },
  ).format(date)
}

function truncateText(
  text,
  maximumLength = 140,
) {
  if (!text) {
    return ""
  }

  if (
    text.length <= maximumLength
  ) {
    return text
  }

  return `${text.slice(
    0,
    maximumLength,
  )}...`
}

function AIActivityWidget() {
  const {
    activeAgent,
    activity,
    activityHistory,
    isAIProcessing,
  } = useAI()

  const status = useMemo(() => {
    if (isAIProcessing) {
      return {
        label: "Käsittelee",
        description:
          "AI Brain käsittelee parhaillaan pyyntöä.",
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-300",
        dotClassName:
          "bg-amber-500",
      }
    }

    if (
      activity.status ===
      "error"
    ) {
      return {
        label: "Virhe",
        description:
          "Viimeisin AI-pyyntö epäonnistui.",
        className:
          "border-red-500/30 bg-red-500/10 text-red-300",
        dotClassName:
          "bg-red-500",
      }
    }

    if (
      activity.status ===
      "completed"
    ) {
      return {
        label: "Valmis",
        description:
          "Viimeisin AI-tehtävä suoritettiin onnistuneesti.",
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        dotClassName:
          "bg-emerald-500",
      }
    }

    return {
      label: "Odottaa",
      description:
        "AI Brain odottaa seuraavaa tehtävää.",
      className:
        "border-neutral-700 bg-neutral-800 text-neutral-400",
      dotClassName:
        "bg-neutral-500",
    }
  }, [
    activity.status,
    isAIProcessing,
  ])

  const hasActivity =
    Boolean(
      activity.question ||
        activity.answer,
    )

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            AI Activity
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            AI Brainin viimeisin toiminta.
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-xl">
          ⚡
        </span>
      </header>

      <div className="space-y-4 p-4">
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${status.className}`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              {isAIProcessing && (
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${status.dotClassName}`}
                />
              )}

              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${status.dotClassName}`}
              />
            </span>

            <div>
              <p className="text-sm font-semibold">
                {status.label}
              </p>

              <p className="mt-0.5 text-xs opacity-70">
                {status.description}
              </p>
            </div>
          </div>

          <span className="shrink-0 text-xs font-medium">
            {formatTime(
              activity.timestamp,
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs uppercase tracking-wider text-neutral-600">
              Aktiivinen agentti
            </p>

            <p className="mt-2 text-sm font-semibold text-white">
              {formatAgentName(
                activeAgent,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs uppercase tracking-wider text-neutral-600">
              Tapahtumia
            </p>

            <p className="mt-2 text-sm font-semibold text-white">
              {
                activityHistory.length
              }
            </p>
          </div>
        </div>

        {!hasActivity && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-5">
            <p className="text-sm font-medium text-white">
              Ei AI-toimintaa
            </p>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Lähetä AI Brainille kysymys
              tai tehtävä. Viimeisin
              tapahtuma ilmestyy tähän.
            </p>
          </div>
        )}

        {hasActivity && (
          <div className="space-y-3">
            {activity.question && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Viimeisin kysymys
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-300">
                  {truncateText(
                    activity.question,
                    180,
                  )}
                </p>
              </div>
            )}

            {activity.answer && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Viimeisin vastaus
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-300">
                  {truncateText(
                    activity.answer,
                    220,
                  )}
                </p>
              </div>
            )}

            {activity.reason && (
              <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <span className="text-lg">
                  ◉
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Agentin valinta
                  </p>

                  <p className="mt-1 text-sm text-neutral-300">
                    {
                      activity.reason
                    }
                  </p>
                </div>
              </div>
            )}

            {activity.action && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Suoritettu toiminto
                </p>

                <p className="mt-2 text-sm text-amber-200">
                  {activity.action
                    .label ||
                    activity.action
                      .path ||
                    activity.action
                      .type ||
                    "AI-toiminto"}
                </p>
              </div>
            )}
          </div>
        )}

        {activityHistory.length >
          1 && (
          <div className="border-t border-neutral-800 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Viimeisimmät tapahtumat
            </p>

            <div className="space-y-2">
              {activityHistory
                .slice(1, 4)
                .map(
                  (
                    historyItem,
                    index,
                  ) => (
                    <div
                      key={`${historyItem.timestamp}-${index}`}
                      className="flex items-center gap-3 rounded-lg bg-neutral-950 px-3 py-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-sm">
                        ⬢
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-neutral-300">
                          {historyItem.question ||
                            "AI-tapahtuma"}
                        </p>

                        <p className="mt-0.5 text-[11px] text-neutral-600">
                          {formatAgentName(
                            historyItem.agent,
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 text-[11px] text-neutral-600">
                        {formatTime(
                          historyItem.timestamp,
                        )}
                      </span>
                    </div>
                  ),
                )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default AIActivityWidget
