import {
  useMemo,
  useState,
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
    return ""
  }

  const date = new Date(timestamp)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ""
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
  maximumLength = 100,
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

function getNotificationStyle(status) {
  if (status === "error") {
    return {
      icon: "⚠️",
      label: "Virhe",
      border:
        "border-red-500/30",
      background:
        "bg-red-500/5",
      badge:
        "bg-red-500/10 text-red-300",
    }
  }

  if (status === "processing") {
    return {
      icon: "⏳",
      label: "Käsittelee",
      border:
        "border-amber-500/30",
      background:
        "bg-amber-500/5",
      badge:
        "bg-amber-500/10 text-amber-300",
    }
  }

  return {
    icon: "✅",
    label: "Valmis",
    border:
      "border-emerald-500/30",
    background:
      "bg-emerald-500/5",
    badge:
      "bg-emerald-500/10 text-emerald-300",
  }
}

function NotificationCenter() {
  const {
    activity,
    activityHistory,
    isAIProcessing,
  } = useAI()

  const [dismissedItems, setDismissedItems] =
    useState([])

  const notifications =
    useMemo(() => {
      const historyItems =
        activityHistory.map(
          (item, index) => ({
            ...item,
            id:
              item.timestamp ||
              `history-${index}`,
          }),
        )

      if (
        isAIProcessing &&
        activity.question
      ) {
        return [
          {
            ...activity,
            id: "processing",
            status: "processing",
          },
          ...historyItems,
        ]
      }

      return historyItems
    }, [
      activity,
      activityHistory,
      isAIProcessing,
    ])

  const visibleNotifications =
    notifications.filter(
      (item) =>
        !dismissedItems.includes(
          item.id,
        ),
    )

  function dismissNotification(id) {
    setDismissedItems(
      (previousItems) => [
        ...previousItems,
        id,
      ],
    )
  }

  function clearNotifications() {
    setDismissedItems(
      notifications.map(
        (item) => item.id,
      ),
    )
  }

  function restoreNotifications() {
    setDismissedItems([])
  }

  return (
    <section className="
      overflow-hidden
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
    ">
      <header className="
        flex
        items-center
        justify-between
        gap-4
        border-b
        border-neutral-800
        px-5
        py-4
      ">
        <div>
          <div className="
            flex
            items-center
            gap-2
          ">
            <h2 className="
              text-lg
              font-semibold
              text-white
            ">
              Notification Center
            </h2>

            {visibleNotifications.length >
              0 && (
              <span className="
                flex
                min-w-6
                items-center
                justify-center
                rounded-full
                bg-amber-500
                px-2
                py-0.5
                text-xs
                font-bold
                text-black
              ">
                {
                  visibleNotifications.length
                }
              </span>
            )}
          </div>

          <p className="
            mt-1
            text-sm
            text-neutral-500
          ">
            AI Brainin ilmoitukset ja
            valmistuneet tehtävät.
          </p>
        </div>

        <span className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-amber-500/10
          text-xl
        ">
          🔔
        </span>
      </header>

      <div className="p-4">
        {visibleNotifications.length ===
          0 && (
          <div className="
            rounded-xl
            border
            border-neutral-800
            bg-neutral-950
            px-4
            py-6
            text-center
          ">
            <span className="
              text-3xl
            ">
              🔕
            </span>

            <p className="
              mt-3
              text-sm
              font-medium
              text-white
            ">
              Ei uusia ilmoituksia
            </p>

            <p className="
              mt-1
              text-xs
              leading-5
              text-neutral-500
            ">
              AI Brainin tehtävät ja
              virheet ilmestyvät tähän.
            </p>

            {notifications.length >
              0 && (
              <button
                type="button"
                onClick={
                  restoreNotifications
                }
                className="
                  mt-4
                  rounded-lg
                  border
                  border-neutral-700
                  px-3
                  py-2
                  text-xs
                  font-medium
                  text-neutral-300
                  transition
                  hover:border-amber-500/50
                  hover:text-white
                "
              >
                Palauta ilmoitukset
              </button>
            )}
          </div>
        )}

        {visibleNotifications.length >
          0 && (
          <>
            <div className="
              max-h-[430px]
              space-y-3
              overflow-y-auto
              pr-1
            ">
              {visibleNotifications
                .slice(0, 10)
                .map(
                  (
                    notification,
                  ) => {
                    const style =
                      getNotificationStyle(
                        notification.status,
                      )

                    return (
                      <article
                        key={
                          notification.id
                        }
                        className={`
                          rounded-xl
                          border
                          p-4
                          ${style.border}
                          ${style.background}
                        `}
                      >
                        <div className="
                          flex
                          items-start
                          gap-3
                        ">
                          <span className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-neutral-950
                            text-base
                          ">
                            {
                              style.icon
                            }
                          </span>

                          <div className="
                            min-w-0
                            flex-1
                          ">
                            <div className="
                              flex
                              flex-wrap
                              items-center
                              justify-between
                              gap-2
                            ">
                              <div className="
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              ">
                                <span
                                  className={`
                                    rounded-full
                                    px-2
                                    py-1
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    ${style.badge}
                                  `}
                                >
                                  {
                                    style.label
                                  }
                                </span>

                                <span className="
                                  text-xs
                                  font-medium
                                  text-neutral-400
                                ">
                                  {formatAgentName(
                                    notification.agent,
                                  )}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  dismissNotification(
                                    notification.id,
                                  )
                                }
                                className="
                                  rounded-md
                                  px-2
                                  py-1
                                  text-xs
                                  text-neutral-600
                                  transition
                                  hover:bg-neutral-800
                                  hover:text-white
                                "
                                aria-label="Poista ilmoitus"
                              >
                                ✕
                              </button>
                            </div>

                            <p className="
                              mt-3
                              text-sm
                              font-medium
                              leading-5
                              text-neutral-200
                            ">
                              {truncateText(
                                notification.question ||
                                  "AI Brain -tapahtuma",
                                110,
                              )}
                            </p>

                            {notification.answer && (
                              <p className="
                                mt-2
                                text-xs
                                leading-5
                                text-neutral-500
                              ">
                                {truncateText(
                                  notification.answer,
                                  150,
                                )}
                              </p>
                            )}

                            <div className="
                              mt-3
                              flex
                              flex-wrap
                              items-center
                              gap-3
                              text-[11px]
                              text-neutral-600
                            ">
                              {notification.timestamp && (
                                <span>
                                  {formatTime(
                                    notification.timestamp,
                                  )}
                                </span>
                              )}

                              {notification.reason && (
                                <span className="
                                  truncate
                                ">
                                  {
                                    notification.reason
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  },
                )}
            </div>

            <button
              type="button"
              onClick={
                clearNotifications
              }
              className="
                mt-4
                w-full
                rounded-xl
                border
                border-neutral-800
                bg-neutral-950
                px-4
                py-3
                text-sm
                font-medium
                text-neutral-400
                transition
                hover:border-red-500/30
                hover:bg-red-500/5
                hover:text-red-300
              "
            >
              Tyhjennä ilmoitukset
            </button>
          </>
        )}
      </div>
    </section>
  )
}

export default NotificationCenter
