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
  timestamp,
) {
  if (!timestamp) {
    return "--:--:--"
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
    return "--:--:--"
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


function getActionLabel(
  action,
  index,
) {
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


function getIntentLabel(
  activity,
) {
  return (
    activity?.intentAnalysis
      ?.primaryIntent ||
    activity?.intentAnalysis
      ?.intent ||
    activity?.plannerDecision
      ?.intent ||
    activity?.plan
      ?.intent ||
    "unknown"
  )
}


function getCapabilityLabel(
  activity,
) {
  const capability =
    activity?.plannerDecision
      ?.capability ||
    activity?.plannerDecision
      ?.capabilityId ||
    activity?.plannerDecision
      ?.selectedCapability ||
    activity?.plan
      ?.capability ||
    activity?.plan
      ?.capabilityId

  if (!capability) {
    return "not-selected"
  }

  if (
    typeof capability ===
    "string"
  ) {
    return capability
  }

  return (
    capability.label ||
    capability.name ||
    capability.id ||
    capability.capabilityId ||
    "not-selected"
  )
}


function getExecutionSteps(
  activity,
) {
  const executionPlan =
    activity?.executionPlan

  if (
    Array.isArray(
      executionPlan,
    )
  ) {
    return executionPlan
  }

  return normalizeItems(
    executionPlan?.steps,
  )
}


function createTimelineItem({
  id,
  order,
  title,
  description,
  timestamp,
  status,
  icon,
}) {
  return {
    id,
    order,
    title,
    description,
    timestamp,
    status:
      normalizeStatus(
        status,
      ),
    icon,
  }
}


function createActivityTimeline(
  activity,
) {
  if (!activity) {
    return []
  }

  const items = []

  const activityStatus =
    normalizeStatus(
      activity.status,
    )

  const requestTimestamp =
    activity.timestamp ||
    activity.createdAt ||
    activity.startedAt ||
    null

  const hasQuestion =
    Boolean(
      String(
        activity.question ||
        "",
      ).trim(),
    )

  const hasIntent =
    Boolean(
      activity.intentAnalysis ||
      activity.plannerDecision
        ?.intent ||
      activity.plan?.intent,
    )

  const hasPlannerDecision =
    Boolean(
      activity.plannerDecision,
    )

  const plannedActions =
    normalizeItems(
      activity.plannerDecision
        ?.actions ||
      activity.actions ||
      activity.action,
    )

  const executionSteps =
    getExecutionSteps(
      activity,
    )

  if (
    hasQuestion ||
    requestTimestamp
  ) {
    items.push(
      createTimelineItem({
        id:
          "request-received",

        order:
          10,

        title:
          "AI Request vastaanotettiin",

        description:
          activity.question ||
          "Käyttäjän pyyntö vastaanotettiin.",

        timestamp:
          requestTimestamp,

        status:
          activityStatus ===
          "error"
            ? "failed"
            : "completed",

        icon:
          "🧠",
      }),
    )
  }

  if (
    hasIntent
  ) {
    items.push(
      createTimelineItem({
        id:
          "intent-analysis",

        order:
          20,

        title:
          "Intent Analysis valmistui",

        description:
          `Tunnistettu intent: ${getIntentLabel(
            activity,
          )}`,

        timestamp:
          activity.intentAnalysis
            ?.timestamp ||
          requestTimestamp,

        status:
          "completed",

        icon:
          "🔎",
      }),
    )
  } else if (
    [
      "processing",
      "planning",
      "active",
    ].includes(
      activityStatus,
    )
  ) {
    items.push(
      createTimelineItem({
        id:
          "intent-analysis-running",

        order:
          20,

        title:
          "Intent Analysis käynnissä",

        description:
          "AI analysoi käyttäjän pyynnön tarkoitusta.",

        timestamp:
          requestTimestamp,

        status:
          "running",

        icon:
          "🔎",
      }),
    )
  }

  if (
    hasPlannerDecision
  ) {
    items.push(
      createTimelineItem({
        id:
          "planner-decision",

        order:
          30,

        title:
          "Planner Decision muodostettiin",

        description:
          `Valittu capability: ${getCapabilityLabel(
            activity,
          )}`,

        timestamp:
          activity.plannerDecision
            ?.timestamp ||
          requestTimestamp,

        status:
          "completed",

        icon:
          "🧩",
      }),
    )
  } else if (
    activityStatus ===
    "planning" &&
    hasIntent
  ) {
    items.push(
      createTimelineItem({
        id:
          "planner-decision-running",

        order:
          30,

        title:
          "Planner muodostaa päätöstä",

        description:
          "Planner valitsee sopivan capabilityn ja toiminnot.",

        timestamp:
          requestTimestamp,

        status:
          "running",

        icon:
          "🧩",
      }),
    )
  }

  if (
    executionSteps.length >
    0
  ) {
    items.push(
      createTimelineItem({
        id:
          "execution-plan-created",

        order:
          40,

        title:
          "Execution Plan luotiin",

        description:
          `${executionSteps.length} vaihetta lisättiin suoritussuunnitelmaan.`,

        timestamp:
          activity.executionPlan
            ?.timestamp ||
          requestTimestamp,

        status:
          "completed",

        icon:
          "📋",
      }),
    )
  } else if (
    plannedActions.length >
    0
  ) {
    items.push(
      createTimelineItem({
        id:
          "action-plan-created",

        order:
          40,

        title:
          "Action Plan luotiin",

        description:
          `${plannedActions.length} toimintoa lisättiin suunnitelmaan.`,

        timestamp:
          requestTimestamp,

        status:
          "ready",

        icon:
          "📋",
      }),
    )
  }

  if (
    activityStatus ===
    "completed"
  ) {
    items.push(
      createTimelineItem({
        id:
          "session-completed",

        order:
          90,

        title:
          "AI Session valmistui",

        description:
          activity.answer ||
          "AI-istunto suoritettiin loppuun.",

        timestamp:
          activity.completedAt ||
          activity.timestamp,

        status:
          "completed",

        icon:
          "🎉",
      }),
    )
  }

  if (
    [
      "error",
      "failed",
      "failure",
    ].includes(
      activityStatus,
    )
  ) {
    items.push(
      createTimelineItem({
        id:
          "session-failed",

        order:
          90,

        title:
          "AI Session epäonnistui",

        description:
          activity.reason ||
          activity.error?.message ||
          activity.error ||
          "AI-istunnon suorittaminen epäonnistui.",

        timestamp:
          activity.completedAt ||
          activity.timestamp,

        status:
          "failed",

        icon:
          "❌",
      }),
    )
  }

  return items
}


function createExecutionTimeline(
  executionState,
) {
  const actions =
    normalizeItems(
      executionState?.actions,
    )

  if (
    actions.length ===
    0
  ) {
    return []
  }

  const items = []

  const queueStatus =
    normalizeStatus(
      executionState?.status,
    )

  const firstAction =
    actions[0]

  items.push(
    createTimelineItem({
      id:
        "queue-created",

      order:
        50,

      title:
        "Action Queue luotiin",

      description:
        `${actions.length} toimintoa lisättiin jonoon.`,

      timestamp:
        executionState?.createdAt ||
        firstAction?.queuedAt ||
        firstAction?.startedAt ||
        null,

      status:
        [
          "idle",
          "pending",
          "queued",
          "ready",
        ].includes(
          queueStatus,
        )
          ? "ready"
          : queueStatus,

      icon:
        "📦",
    }),
  )

  actions.forEach(
    (
      queueItem,
      index,
    ) => {
      const action =
        queueItem?.action ||
        queueItem

      const label =
        getActionLabel(
          action,
          index,
        )

      const itemStatus =
        normalizeStatus(
          queueItem?.status,
        )

      if (
        queueItem?.startedAt ||
        [
          "running",
          "processing",
          "executing",
          "active",
        ].includes(
          itemStatus,
        )
      ) {
        items.push(
          createTimelineItem({
            id:
              `${queueItem?.id || index}-started`,

            order:
              60 +
              index * 2,

            title:
              `Toiminto ${index + 1} käynnistyi`,

            description:
              label,

            timestamp:
              queueItem?.startedAt ||
              null,

            status:
              [
                "completed",
                "success",
                "succeeded",
                "done",
              ].includes(
                itemStatus,
              )
                ? "completed"
                : "running",

            icon:
              "⚡",
          }),
        )
      }

      if (
        queueItem?.completedAt ||
        [
          "completed",
          "success",
          "succeeded",
          "done",
          "failed",
          "failure",
          "error",
          "rejected",
        ].includes(
          itemStatus,
        )
      ) {
        const wasSuccessful =
          [
            "completed",
            "success",
            "succeeded",
            "done",
          ].includes(
            itemStatus,
          ) ||
          queueItem?.result
            ?.success === true

        const resultMessage =
          queueItem?.result
            ?.message ||
          queueItem?.result
            ?.error?.message ||
          queueItem?.result
            ?.error ||
          queueItem?.error
            ?.message ||
          queueItem?.error ||
          label

        items.push(
          createTimelineItem({
            id:
              `${queueItem?.id || index}-completed`,

            order:
              61 +
              index * 2,

            title:
              wasSuccessful
                ? `Toiminto ${index + 1} onnistui`
                : `Toiminto ${index + 1} epäonnistui`,

            description:
              resultMessage,

            timestamp:
              queueItem?.completedAt ||
              null,

            status:
              wasSuccessful
                ? "completed"
                : "failed",

            icon:
              wasSuccessful
                ? "✅"
                : "❌",
          }),
        )
      }
    },
  )

  if (
    [
      "completed",
      "completed_with_errors",
      "failed",
      "error",
    ].includes(
      queueStatus,
    )
  ) {
    const lastCompletedItem =
      [...actions]
        .reverse()
        .find(
          (item) =>
            item?.completedAt,
        )

    const completedCount =
      Number(
        executionState
          ?.completedCount ||
        0,
      )

    const failedCount =
      Number(
        executionState
          ?.failedCount ||
        0,
      )

    const queueSucceeded =
      queueStatus ===
      "completed"

    items.push(
      createTimelineItem({
        id:
          "queue-completed",

        order:
          80,

        title:
          queueSucceeded
            ? "Action Queue valmistui"
            : queueStatus ===
                "completed_with_errors"
              ? "Action Queue valmistui virheiden kanssa"
              : "Action Queue epäonnistui",

        description:
          `${completedCount} onnistui, ${failedCount} epäonnistui.`,

        timestamp:
          executionState
            ?.completedAt ||
          lastCompletedItem
            ?.completedAt ||
          null,

        status:
          queueSucceeded
            ? "completed"
            : queueStatus ===
                "completed_with_errors"
              ? "warning"
              : "failed",

        icon:
          queueSucceeded
            ? "🏁"
            : queueStatus ===
                "completed_with_errors"
              ? "⚠️"
              : "❌",
      }),
    )
  }

  return items
}


function compareTimelineItems(
  first,
  second,
) {
  const firstTimestamp =
    first.timestamp
      ? new Date(
          first.timestamp,
        ).getTime()
      : Number.NaN

  const secondTimestamp =
    second.timestamp
      ? new Date(
          second.timestamp,
        ).getTime()
      : Number.NaN

  const bothHaveValidTimes =
    Number.isFinite(
      firstTimestamp,
    ) &&
    Number.isFinite(
      secondTimestamp,
    )

  if (
    bothHaveValidTimes &&
    firstTimestamp !==
      secondTimestamp
  ) {
    return (
      firstTimestamp -
      secondTimestamp
    )
  }

  return (
    Number(
      first.order ||
      0,
    ) -
    Number(
      second.order ||
      0,
    )
  )
}


function TimelineRow({
  item,
  isLast,
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg">
          {item.icon}
        </div>

        {!isLast && (
          <div className="my-2 h-full min-h-10 w-px bg-neutral-800" />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-neutral-500">
                  {formatTimestamp(
                    item.timestamp,
                  )}
                </span>

                <StatusBadge
                  status={
                    item.status
                  }
                />
              </div>

              <h3 className="mt-2 break-words font-semibold text-white">
                {item.title}
              </h3>
            </div>
          </div>

          {item.description && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-400">
              {String(
                item.description,
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}


function ExecutionTimeline({
  activity,
  executionState,
}) {
  const timelineItems = [
    ...createActivityTimeline(
      activity,
    ),

    ...createExecutionTimeline(
      executionState,
    ),
  ].sort(
    compareTimelineItems,
  )

  const timelineStatus =
    timelineItems.length ===
    0
      ? "empty"
      : executionState
          ?.status ||
        activity?.status ||
        "idle"

  return (
    <Section
      title="Execution Timeline"
      description="Näyttää AI Requestin, analyysin, plannerin päätöksen, execution planin ja järjestelmätoiminnot oikeassa etenemisjärjestyksessä."
      action={
        <StatusBadge
          status={
            timelineStatus
          }
        >
          {
            timelineItems.length
          }
        </StatusBadge>
      }
    >
      {timelineItems.length ===
      0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-6 text-center">
          <p className="text-sm text-neutral-500">
            Aikajanalla ei ole vielä tapahtumia.
          </p>
        </div>
      ) : (
        <div>
          {timelineItems.map(
            (
              item,
              index,
            ) => (
              <TimelineRow
                key={
                  item.id ||
                  `timeline-${index}`
                }
                item={
                  item
                }
                isLast={
                  index ===
                  timelineItems.length -
                    1
                }
              />
            ),
          )}
        </div>
      )}
    </Section>
  )
}


export default ExecutionTimeline
