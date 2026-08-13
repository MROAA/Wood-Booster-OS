import {
  useState,
} from "react"

import ActionResultCard from "./ActionResultCard"
import InfoCard from "./InfoCard"
import Section from "./Section"
import StatusBadge from "./StatusBadge"


function normalizeItems(
  items,
) {
  if (!items) {
    return []
  }

  if (
    Array.isArray(
      items,
    )
  ) {
    return items.filter(
      Boolean,
    )
  }

  return [
    items,
  ]
}


function normalizeStatus(
  status,
) {
  return String(
    status ||
    "idle",
  )
    .trim()
    .toLowerCase()
}


function getHistoryStatus(
  history,
) {
  if (
    history.length ===
    0
  ) {
    return "empty"
  }

  const hasFailed =
    history.some(
      (item) => {
        const status =
          normalizeStatus(
            item?.status ||
            item?.result
              ?.status ||
            item?.actionResult
              ?.status,
          )

        return [
          "failed",
          "failure",
          "error",
          "rejected",
          "completed_with_errors",
        ].includes(
          status,
        )
      },
    )

  if (
    hasFailed
  ) {
    return "warning"
  }

  return "completed"
}


function countByStatuses(
  history,
  statuses,
) {
  return history.filter(
    (item) => {
      const status =
        normalizeStatus(
          item?.status ||
          item?.result
            ?.status ||
          item?.actionResult
            ?.status,
        )

      return statuses.includes(
        status,
      )
    },
  ).length
}


function formatDate(
  value,
) {
  if (!value) {
    return "Ei aikaleimaa"
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

  return new Intl.DateTimeFormat(
    "fi-FI",
    {
      dateStyle:
        "short",

      timeStyle:
        "medium",
    },
  ).format(
    date,
  )
}


function formatAgentName(
  agent,
) {
  const names = {
    system:
      "System",

    workshop:
      "Workshop Agent",

    product:
      "Product Agent",

    pricing:
      "Pricing Agent",

    marketing:
      "Marketing Agent",

    crm:
      "CRM Agent",

    development:
      "Developer Agent",
  }

  return (
    names[agent] ||
    agent ||
    "AI Brain"
  )
}


function getPlannerId(
  plannerDecision,
) {
  return (
    plannerDecision
      ?.plannerId ||
    plannerDecision
      ?.selectedPlanner ||
    plannerDecision
      ?.planner?.id ||
    plannerDecision
      ?.planner ||
    plannerDecision
      ?.capability ||
    "Ei planneria"
  )
}


function getIntent(
  item,
) {
  return (
    item?.intentAnalysis
      ?.primaryIntent ||
    item?.intentAnalysis
      ?.intent ||
    item?.plan
      ?.intent ||
    "Ei intentiä"
  )
}


function getActions(
  item,
) {
  if (
    Array.isArray(
      item?.actions,
    )
  ) {
    return item.actions
  }

  if (
    item?.action
  ) {
    return [
      item.action,
    ]
  }

  return []
}


function getActionLabel(
  action,
) {
  if (!action) {
    return "AI-toiminto"
  }

  if (
    typeof action ===
    "string"
  ) {
    return action
  }

  return (
    action.label ||
    action.name ||
    action.projectName ||
    action.customerName ||
    action.path ||
    action.type ||
    "AI-toiminto"
  )
}


function getExecutionSteps(
  executionPlan,
) {
  if (
    Array.isArray(
      executionPlan,
    )
  ) {
    return executionPlan
  }

  if (
    Array.isArray(
      executionPlan
        ?.steps,
    )
  ) {
    return executionPlan
      .steps
  }

  return []
}


function getHistoryItemStatus(
  item,
) {
  return (
    item?.status ||
    item?.actionResult
      ?.status ||
    item?.result
      ?.status ||
    (
      item?.actionResult
        ?.success === true
        ? "completed"
        : item?.actionResult
              ?.success ===
            false
          ? "failed"
          : "idle"
    )
  )
}


function HistoryDetails({
  item,
}) {
  const actions =
    getActions(
      item,
    )

  const executionSteps =
    getExecutionSteps(
      item?.executionPlan,
    )

  const results =
    normalizeItems(
      item?.actionResult
        ?.results ||
      item?.results,
    )

  return (
    <div className="mt-4 space-y-4 border-t border-[var(--wood-border)] pt-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)]/60 p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--wood-muted)]">
            Agentti
          </p>

          <p className="mt-2 text-sm font-semibold text-[var(--wood-text)]">
            {formatAgentName(
              item?.agent,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)]/60 p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--wood-muted)]">
            Intent
          </p>

          <p className="mt-2 break-words text-sm font-semibold text-[var(--wood-text)]">
            {getIntent(
              item,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)]/60 p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--wood-muted)]">
            Planner
          </p>

          <p className="mt-2 break-words text-sm font-semibold text-[var(--wood-text)]">
            {String(
              getPlannerId(
                item?.plannerDecision,
              ),
            )}
          </p>
        </div>
      </div>

      {item?.question && (
        <div className="rounded-xl border border-[var(--wood-accent)]/20 bg-[var(--wood-accent)]/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-accent)]">
            Käyttäjän pyyntö
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--wood-text)]">
            {item.question}
          </p>
        </div>
      )}

      {item?.answer && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
            AI-vastaus
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--wood-text)]">
            {item.answer}
          </p>
        </div>
      )}

      {item?.reason && (
        <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)]/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
            Perustelu
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--wood-text)]">
            {item.reason}
          </p>
        </div>
      )}

      {executionSteps.length >
        0 && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-indigo-300">
              Execution Plan
            </p>

            <StatusBadge status="active">
              {
                executionSteps.length
              }{" "}
              vaihetta
            </StatusBadge>
          </div>

          <div className="mt-3 space-y-2">
            {executionSteps.map(
              (
                step,
                index,
              ) => (
                <div
                  key={
                    step?.id ||
                    `history-step-${index}`
                  }
                  className="rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)]/50 px-3 py-3"
                >
                  <p className="text-sm font-medium text-[var(--wood-text)]">
                    {index +
                      1}
                    .{" "}
                    {step?.command ||
                      step?.action
                        ?.label ||
                      step?.action
                        ?.type ||
                      "AI-toiminto"}
                  </p>

                  {step?.dependsOn &&
                    normalizeItems(
                      step.dependsOn,
                    ).length >
                      0 && (
                      <p className="mt-1 text-xs text-[var(--wood-muted)]">
                        Riippuu vaiheista:{" "}
                        {normalizeItems(
                          step.dependsOn,
                        ).join(
                          ", ",
                        )}
                      </p>
                    )}
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {actions.length >
        0 && (
        <div className="rounded-xl border border-[var(--wood-accent)]/20 bg-[var(--wood-accent)]/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--wood-accent)]">
              Action Queue
            </p>

            <StatusBadge status="active">
              {
                actions.length
              }{" "}
              toimintoa
            </StatusBadge>
          </div>

          <div className="mt-3 space-y-2">
            {actions.map(
              (
                action,
                index,
              ) => (
                <div
                  key={
                    action?.id ||
                    `history-action-${index}`
                  }
                  className="rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)]/50 px-3 py-3"
                >
                  <p className="text-sm font-medium text-[var(--wood-text)]">
                    {index +
                      1}
                    .{" "}
                    {getActionLabel(
                      action,
                    )}
                  </p>

                  {action?.type && (
                    <p className="mt-1 text-xs text-[var(--wood-muted)]">
                      Tyyppi:{" "}
                      {action.type}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {item?.actionResult && (
        <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)]/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--wood-text)]">
              Suorituksen yhteenveto
            </p>

            <StatusBadge
              status={
                item.actionResult
                  .success
                  ? "completed"
                  : "failed"
              }
            >
              {item.actionResult
                .success
                ? "Onnistui"
                : "Epäonnistui"}
            </StatusBadge>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <InfoCard
              label="Valmis"
              value={
                item.actionResult
                  .completedCount ||
                0
              }
            />

            <InfoCard
              label="Epäonnistui"
              value={
                item.actionResult
                  .failedCount ||
                0
              }
            />

            <InfoCard
              label="Yhteensä"
              value={
                item.actionResult
                  .totalCount ||
                actions.length
              }
            />
          </div>

          {item.actionResult
            .message && (
            <p className="mt-3 text-sm text-[var(--wood-muted)]">
              {
                item.actionResult
                  .message
              }
            </p>
          )}
        </div>
      )}

      {results.length >
        0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--wood-text)]">
            Toimintojen tulokset
          </p>

          {results.map(
            (
              result,
              index,
            ) => (
              <ActionResultCard
                key={
                  result?.id ||
                  result?.actionId ||
                  `history-detail-result-${index}`
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
      )}
    </div>
  )
}


function ExecutionHistoryItem({
  item,
  index,
}) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false)

  const actions =
    getActions(
      item,
    )

  const status =
    getHistoryItemStatus(
      item,
    )

  return (
    <article className="rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)]/70 p-4">
      <button
        type="button"
        onClick={() =>
          setIsOpen(
            (previousValue) =>
              !previousValue,
          )
        }
        className="w-full text-left"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={
                  status
                }
              >
                {
                  status
                }
              </StatusBadge>

              <span className="text-xs text-[var(--wood-muted)]">
                {formatDate(
                  item?.timestamp ||
                  item?.completedAt ||
                  item?.createdAt,
                )}
              </span>
            </div>

            <p className="mt-3 truncate text-sm font-semibold text-[var(--wood-text)]">
              {item?.question ||
                item?.answer ||
                item?.message ||
                `AI-suoritus ${index + 1}`}
            </p>

            <p className="mt-1 text-xs text-[var(--wood-muted)]">
              {formatAgentName(
                item?.agent,
              )}
              {" • "}
              {actions.length}{" "}
              toimintoa
            </p>
          </div>

          <span className="shrink-0 text-sm font-medium text-[var(--wood-accent)]">
            {isOpen
              ? "Sulje tiedot ▲"
              : "Avaa tiedot ▼"}
          </span>
        </div>
      </button>

      {isOpen && (
        <HistoryDetails
          item={
            item
          }
        />
      )}
    </article>
  )
}


function ExecutionHistory({
  history,
  executions,
  results,
}) {
  const historyItems =
    normalizeItems(
      history ||
      executions ||
      results,
    )

  const completedCount =
    countByStatuses(
      historyItems,
      [
        "completed",
        "complete",
        "success",
        "succeeded",
        "done",
      ],
    )

  const failedCount =
    countByStatuses(
      historyItems,
      [
        "failed",
        "failure",
        "error",
        "rejected",
        "completed_with_errors",
      ],
    )

  const pendingCount =
    countByStatuses(
      historyItems,
      [
        "pending",
        "queued",
        "waiting",
        "ready",
        "running",
        "processing",
        "planning",
        "executing",
        "active",
      ],
    )

  const historyStatus =
    getHistoryStatus(
      historyItems,
    )

  return (
    <Section
      title="Execution History"
      description="Näyttää aikaisemmat AI-istunnot, suunnitelmat, toimintojonot ja tulokset."
      action={
        <StatusBadge
          status={
            historyStatus
          }
        >
          {
            historyItems.length
          }
        </StatusBadge>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label="Suorituksia"
          value={
            historyItems.length
          }
        />

        <InfoCard
          label="Valmis"
          value={
            completedCount
          }
        />

        <InfoCard
          label="Kesken"
          value={
            pendingCount
          }
        />

        <InfoCard
          label="Epäonnistui"
          value={
            failedCount
          }
        />
      </div>

      {historyItems.length ===
      0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--wood-border)] bg-[var(--wood-bg)] p-6 text-center">
          <p className="text-sm text-[var(--wood-muted)]">
            Suoritushistoria on tyhjä.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {historyItems.map(
            (
              item,
              index,
            ) => (
              <ExecutionHistoryItem
                key={
                  item?.id ||
                  item?.executionId ||
                  item?.timestamp ||
                  `history-item-${index}`
                }
                item={
                  item
                }
                index={
                  index
                }
              />
            ),
          )}
        </div>
      )}
    </Section>
  )
}


export default ExecutionHistory
