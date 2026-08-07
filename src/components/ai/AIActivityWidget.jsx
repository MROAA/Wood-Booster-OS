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
          "border-[var(--wood-accent)]/30 bg-[var(--wood-accent)]/10 text-[var(--wood-accent)]",
        dotClassName:
          "bg-[var(--wood-accent)]",
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
        "border-[var(--wood-border)] bg-[var(--wood-card)] text-[var(--wood-muted)]",
      dotClassName:
        "bg-[var(--wood-muted)]",
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
    <section className="overflow-hidden rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)]">
      <header className="flex items-center justify-between border-b border-[var(--wood-border)] px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--wood-text)]">
            AI Activity
          </h2>

          <p className="mt-1 text-sm text-[var(--wood-muted)]">
            AI Brainin viimeisin toiminta.
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--wood-accent)]/10 text-xl">
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
          <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
            <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
              Aktiivinen agentti
            </p>

            <p className="mt-2 text-sm font-semibold text-[var(--wood-text)]">
              {formatAgentName(
                activeAgent,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
            <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
              Tapahtumia
            </p>

            <p className="mt-2 text-sm font-semibold text-[var(--wood-text)]">
              {
                activityHistory.length
              }
            </p>
          </div>
        </div>

        {!hasActivity && (
          <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] px-4 py-5">
            <p className="text-sm font-medium text-[var(--wood-text)]">
              Ei AI-toimintaa
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--wood-muted)]">
              Lähetä AI Brainille kysymys
              tai tehtävä. Viimeisin
              tapahtuma ilmestyy tähän.
            </p>
          </div>
        )}

        {hasActivity && (
          <div className="space-y-3">
            {activity.question && (
              <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--wood-muted)]">
                  Viimeisin kysymys
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--wood-text)]">
                  {truncateText(
                    activity.question,
                    180,
                  )}
                </p>
              </div>
            )}

            {activity.answer && (
              <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--wood-muted)]">
                  Viimeisin vastaus
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--wood-text)]">
                  {truncateText(
                    activity.answer,
                    220,
                  )}
                </p>
              </div>
            )}

            {activity.reason && (
              <div className="flex items-start gap-3 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-4">
                <span className="text-lg">
                  ◉
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--wood-muted)]">
                    Agentin valinta
                  </p>

                  <p className="mt-1 text-sm text-[var(--wood-text)]">
                    {
                      activity.reason
                    }
                  </p>
                </div>
              </div>
            )}

            {activity.action && (
              <div className="rounded-xl border border-[var(--wood-accent)]/30 bg-[var(--wood-accent)]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--wood-accent)]">
                  Suoritettu toiminto
                </p>

                <p className="mt-2 text-sm text-[var(--wood-accent)]">
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
          <div className="border-t border-[var(--wood-border)] pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--wood-muted)]">
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
                      className="flex items-center gap-3 rounded-lg bg-[var(--wood-bg)] px-3 py-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--wood-card)] text-sm">
                        ⬢
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[var(--wood-text)]">
                          {historyItem.question ||
                            "AI-tapahtuma"}
                        </p>

                        <p className="mt-0.5 text-[11px] text-[var(--wood-muted)]">
                          {formatAgentName(
                            historyItem.agent,
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 text-[11px] text-[var(--wood-muted)]">
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
