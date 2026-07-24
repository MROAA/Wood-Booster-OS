import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  useNavigate,
} from "react-router-dom"

import {
  useAI,
} from "../../context/AIContext"

import {
  normalizeActionResponse,
} from "../../services/aiActionDispatcher"

import {
  runAISession,
} from "../../services/aiSession"


const welcomeMessage = {
  id:
    "welcome",

  role:
    "assistant",

  content:
    "Wood-Booster AI Workspace on valmis. Voit keskustella AI Brainin kanssa tai antaa komentoja, kuten: Avaa projektit, Luo projekti Aurora ja sitten avaa projektit.",

  agent:
    "system",
}


function createMessageId() {
  return `${Date.now()}-${Math.random()}`
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


function getActionLabel(
  action,
) {
  if (!action) {
    return ""
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


function getActionTypeLabel(
  action,
) {
  const actionType =
    String(
      action?.type ||
      "",
    )
      .trim()
      .toLowerCase()

  const labels = {
    navigate:
      "Navigointi",

    create_project:
      "Projektin luominen",

    update_project:
      "Projektin päivittäminen",

    create_customer:
      "Asiakkaan luominen",

    open_project:
      "Projektin avaaminen",

    open_project_tab:
      "Projektin välilehden avaaminen",

    open_customer:
      "Asiakkaan avaaminen",

    open_projects:
      "Projektien avaaminen",

    open_customers:
      "Asiakkaiden avaaminen",

    open_knowledge:
      "Tietopankin avaaminen",

    open_memory:
      "Muistin avaaminen",

    open_tools:
      "Työkalujen avaaminen",

    open_settings:
      "Asetusten avaaminen",
  }

  return (
    labels[actionType] ||
    actionType ||
    "AI-toiminto"
  )
}


function getQueueSummary(
  queueResult,
) {
  if (!queueResult) {
    return ""
  }

  if (
    queueResult.totalCount ===
      1 &&
    queueResult.results?.[0]
      ?.message
  ) {
    return queueResult
      .results[0]
      .message
  }

  return (
    queueResult.message ||
    "Action Queue käsiteltiin."
  )
}


function createConversation(
  messages,
) {
  return messages
    .filter(
      (chatMessage) =>
        chatMessage.id !==
          "welcome" &&
        chatMessage.role &&
        chatMessage.content,
    )
    .map(
      (chatMessage) => ({
        role:
          chatMessage.role,

        content:
          chatMessage.content,
      }),
    )
}


function getPrimaryIntent(
  intentAnalysis,
) {
  return (
    intentAnalysis
      ?.primaryIntent ||
    intentAnalysis?.intent ||
    "unknown"
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
    "not-selected"
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
      executionPlan?.steps,
    )
  ) {
    return executionPlan.steps
  }

  return []
}


function ChatPanel() {
  const navigate =
    useNavigate()

  const {
    activeAgent,
    beginAIActivity,
    updateAIPlanning,
    beginActionQueue,
    updateActionQueue,
    startAction,
    completeAction,
    completeAIActivity,
    failAIActivity,
    resetAIActivity,
  } = useAI()

  const [
    message,
    setMessage,
  ] = useState("")

  const [
    messages,
    setMessages,
  ] = useState([
    welcomeMessage,
  ])

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    livePlanning,
    setLivePlanning,
  ] = useState(null)

  const messagesEndRef =
    useRef(null)


  useEffect(
    () => {
      messagesEndRef.current
        ?.scrollIntoView({
          behavior:
            "smooth",
        })
    },
    [
      messages,
      loading,
      livePlanning,
    ],
  )


  function handlePlanningReady(
    planningSnapshot,
  ) {
    setLivePlanning(
      planningSnapshot,
    )

    updateAIPlanning(
      planningSnapshot,
    )
  }


  async function sendMessage() {
    const trimmedMessage =
      message.trim()

    if (
      !trimmedMessage ||
      loading
    ) {
      return
    }

    const userMessage = {
      id:
        createMessageId(),

      role:
        "user",

      content:
        trimmedMessage,
    }

    const conversation =
      createConversation(
        messages,
      )

    setMessages(
      (previousMessages) => [
        ...previousMessages,
        userMessage,
      ],
    )

    setMessage(
      "",
    )

    setLoading(
      true,
    )

    setLivePlanning(
      null,
    )

    beginAIActivity(
      trimmedMessage,
    )

    try {
      const sessionResult =
        await runAISession({
          message:
            trimmedMessage,

          conversation,

          navigate,

          executeActions:
            true,

          stopOnError:
            false,

          onPlanningReady:
            handlePlanningReady,

          onQueueStart:
            beginActionQueue,

          onQueueChange:
            updateActionQueue,

          onActionStart:
            startAction,

          onActionComplete:
            completeAction,
        })

      const actions =
        normalizeActionResponse(
          sessionResult.actions,
        )

      const intentAnalysis =
        sessionResult
          .intentAnalysis ||
        null

      const plannerDecision =
        sessionResult
          .plannerDecision ||
        null

      const executionPlan =
        sessionResult
          .executionPlan ||
        null

      const aiMessage = {
        id:
          createMessageId(),

        role:
          "assistant",

        agent:
          sessionResult.agent ||
          "system",

        reason:
          sessionResult.reason ||
          "",

        content:
          sessionResult.message ||
          "AI Session ei palauttanut vastausta.",

        plan:
          sessionResult.plan ||
          null,

        intentAnalysis,

        plannerDecision,

        executionPlan,

        actions,

        actionResult:
          sessionResult
            .actionResult ||
          null,

        isError:
          !sessionResult.success &&
          actions.length === 0,
      }

      setMessages(
        (previousMessages) => [
          ...previousMessages,
          aiMessage,
        ],
      )

      if (
        sessionResult.success
      ) {
        completeAIActivity({
          agent:
            sessionResult.agent ||
            "system",

          question:
            trimmedMessage,

          answer:
            sessionResult.message ||
            "",

          reason:
            sessionResult.reason ||
            "",

          action:
            actions[0] ||
            null,

          actions,

          plan:
            sessionResult.plan ||
            null,

          intentAnalysis,

          plannerDecision,

          executionPlan,

          actionResult:
            sessionResult
              .actionResult ||
            null,

          source:
            sessionResult.source ||
            "",

          type:
            sessionResult.type ||
            "",
        })
      } else {
        failAIActivity({
          agent:
            sessionResult.agent ||
            "system",

          question:
            trimmedMessage,

          answer:
            sessionResult.message ||
            "",

          reason:
            sessionResult.reason ||
            "AI Session epäonnistui",

          action:
            actions[0] ||
            null,

          actions,

          plan:
            sessionResult.plan ||
            null,

          intentAnalysis,

          plannerDecision,

          executionPlan,

          actionResult:
            sessionResult
              .actionResult ||
            null,

          source:
            sessionResult.source ||
            "",

          type:
            sessionResult.type ||
            "",
        })
      }
    } catch (error) {
      console.error(
        "ChatPanel AI Session error:",
        error,
      )

      const errorMessage =
        "AI Sessionin suorittaminen epäonnistui. Tarkista, että backend on käynnissä portissa 3001."

      setMessages(
        (previousMessages) => [
          ...previousMessages,

          {
            id:
              createMessageId(),

            role:
              "assistant",

            agent:
              "system",

            content:
              errorMessage,

            isError:
              true,

            actions:
              [],

            actionResult:
              null,
          },
        ],
      )

      failAIActivity({
        question:
          trimmedMessage,

        answer:
          errorMessage,
      })
    } finally {
      setLoading(
        false,
      )

      setLivePlanning(
        null,
      )
    }
  }


  function clearConversation() {
    setMessages([
      welcomeMessage,
    ])

    setMessage(
      "",
    )

    setLivePlanning(
      null,
    )

    resetAIActivity()
  }


  function handleKeyDown(
    event,
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()

      sendMessage()
    }
  }


  const liveActions =
    normalizeActionResponse(
      livePlanning?.actions,
    )

  const liveSteps =
    getExecutionSteps(
      livePlanning
        ?.executionPlan,
    )


  return (
    <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <header className="flex flex-col gap-4 border-b border-neutral-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-xl">
            🧠
          </span>

          <div>
            <h2 className="text-lg font-bold text-white">
              AI Brain
            </h2>

            <p className="text-xs text-neutral-500">
              Aktiivinen agentti:{" "}
              {formatAgentName(
                activeAgent,
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            clearConversation
          }
          disabled={
            loading
          }
          className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-400 transition hover:border-neutral-600 hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tyhjennä keskustelu
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
        {messages.map(
          (
            chatMessage,
          ) => {
            const messageActions =
              normalizeActionResponse(
                chatMessage.actions ??
                chatMessage.action,
              )

            const executionSteps =
              getExecutionSteps(
                chatMessage
                  .executionPlan,
              )

            return (
              <div
                key={
                  chatMessage.id
                }
                className={`flex ${
                  chatMessage.role ===
                  "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                    chatMessage.role ===
                    "user"
                      ? "rounded-br-md bg-amber-500 text-black"
                      : chatMessage.isError
                        ? "rounded-bl-md border border-red-900 bg-red-950/40 text-red-200"
                        : "rounded-bl-md border border-neutral-700 bg-neutral-800 text-neutral-100"
                  }`}
                >
                  {chatMessage.role ===
                    "assistant" && (
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold uppercase tracking-wide text-amber-500">
                        {formatAgentName(
                          chatMessage.agent,
                        )}
                      </span>

                      {chatMessage.reason && (
                        <span className="text-neutral-500">
                          {
                            chatMessage.reason
                          }
                        </span>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {chatMessage.content}
                  </p>

                  {chatMessage.intentAnalysis && (
                    <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs">
                      <p className="font-semibold text-violet-300">
                        Intent Analysis
                      </p>

                      <p className="mt-2 text-neutral-400">
                        Primary Intent:{" "}
                        <span className="text-neutral-200">
                          {getPrimaryIntent(
                            chatMessage
                              .intentAnalysis,
                          )}
                        </span>
                      </p>

                      <p className="mt-1 text-neutral-400">
                        Confidence:{" "}
                        <span className="text-neutral-200">
                          {typeof chatMessage
                            .intentAnalysis
                            .confidence ===
                          "number"
                            ? `${Math.round(
                                chatMessage
                                  .intentAnalysis
                                  .confidence *
                                  100,
                              )} %`
                            : "not-set"}
                        </span>
                      </p>
                    </div>
                  )}

                  {chatMessage.plannerDecision && (
                    <div className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs">
                      <p className="font-semibold text-cyan-300">
                        Planner Decision
                      </p>

                      <p className="mt-2 text-neutral-400">
                        Planner:{" "}
                        <span className="text-neutral-200">
                          {String(
                            getPlannerId(
                              chatMessage
                                .plannerDecision,
                            ),
                          )}
                        </span>
                      </p>

                      <p className="mt-1 text-neutral-400">
                        Match:{" "}
                        <span className="text-neutral-200">
                          {chatMessage
                            .plannerDecision
                            .hasMatchedPlanner ===
                          false
                            ? "Ei"
                            : "Kyllä"}
                        </span>
                      </p>
                    </div>
                  )}

                  {executionSteps.length >
                    0 && (
                    <div className="mt-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-3 text-xs">
                      <p className="font-semibold text-indigo-300">
                        Execution Plan
                      </p>

                      <div className="mt-2 space-y-2">
                        {executionSteps.map(
                          (
                            step,
                            index,
                          ) => (
                            <div
                              key={
                                step.id ||
                                `execution-step-${index}`
                              }
                              className="rounded-md border border-neutral-700/70 bg-neutral-950/30 px-3 py-2"
                            >
                              <p className="font-medium text-neutral-200">
                                Step{" "}
                                {index + 1}
                                :{" "}
                                {step.command ||
                                  step.action
                                    ?.type ||
                                  step.plannerId ||
                                  "AI-toiminto"}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {messageActions.length >
                    0 && (
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-medium text-amber-300">
                          <span>
                            ⚡
                          </span>

                          <span>
                            Action Queue
                          </span>
                        </div>

                        <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs text-amber-200">
                          {
                            messageActions.length
                          }{" "}
                          toimintoa
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {messageActions.map(
                          (
                            action,
                            index,
                          ) => {
                            const actionExecutionResult =
                              chatMessage
                                .actionResult
                                ?.results?.[
                                index
                              ]

                            return (
                              <div
                                key={`${chatMessage.id}-action-${index}`}
                                className="rounded-lg border border-neutral-700/70 bg-neutral-950/30 px-3 py-2"
                              >
                                <p className="text-xs font-semibold text-amber-200">
                                  {index +
                                    1}
                                  .{" "}
                                  {getActionTypeLabel(
                                    action,
                                  )}
                                </p>

                                <p className="mt-1 break-words text-xs text-neutral-400">
                                  {getActionLabel(
                                    action,
                                  )}
                                </p>

                                {actionExecutionResult?.message && (
                                  <p
                                    className={`mt-2 text-xs ${
                                      actionExecutionResult.success
                                        ? "text-emerald-300"
                                        : "text-red-300"
                                    }`}
                                  >
                                    {
                                      actionExecutionResult.message
                                    }
                                  </p>
                                )}
                              </div>
                            )
                          },
                        )}
                      </div>

                      {chatMessage.actionResult && (
                        <div
                          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                            chatMessage
                              .actionResult
                              .success
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-red-500/30 bg-red-500/10 text-red-300"
                          }`}
                        >
                          <p className="font-semibold">
                            {chatMessage
                              .actionResult
                              .success
                              ? "Action Queue suoritettu"
                              : "Action Queue epäonnistui"}
                          </p>

                          <p className="mt-1 opacity-80">
                            {getQueueSummary(
                              chatMessage
                                .actionResult,
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          },
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-neutral-700 bg-neutral-800 px-4 py-3 text-neutral-300 sm:max-w-[75%]">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />

                <span>
                  {livePlanning
                    ? "Suunnitelma valmis, toimintoja suoritetaan..."
                    : "AI Session käsittelee pyyntöä..."}
                </span>
              </div>

              {livePlanning && (
                <div className="mt-4 space-y-3">
                  {livePlanning
                    .plannerDecision && (
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs">
                      <p className="font-semibold text-cyan-300">
                        Planner Decision
                      </p>

                      <p className="mt-1 text-neutral-300">
                        {String(
                          getPlannerId(
                            livePlanning
                              .plannerDecision,
                          ),
                        )}
                      </p>
                    </div>
                  )}

                  {liveSteps.length >
                    0 && (
                    <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs">
                      <p className="font-semibold text-indigo-300">
                        Execution Plan
                      </p>

                      <p className="mt-1 text-neutral-300">
                        {
                          liveSteps.length
                        }{" "}
                        vaihetta
                      </p>
                    </div>
                  )}

                  {liveActions.length >
                    0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                      <p className="font-semibold text-amber-300">
                        Action Queue
                      </p>

                      <p className="mt-1 text-neutral-300">
                        {
                          liveActions.length
                        }{" "}
                        toimintoa odottaa tai suoritetaan
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div
          ref={
            messagesEndRef
          }
        />
      </div>

      <footer className="border-t border-neutral-800 bg-neutral-950/50 p-4">
        <div className="flex items-end gap-3">
          <textarea
            value={
              message
            }
            onChange={
              (
                event,
              ) =>
                setMessage(
                  event.target
                    .value,
                )
            }
            onKeyDown={
              handleKeyDown
            }
            disabled={
              loading
            }
            rows={
              1
            }
            placeholder="Kirjoita viesti tai komento AI Brainille..."
            className="min-h-12 max-h-40 flex-1 resize-y rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="button"
            onClick={
              sendMessage
            }
            disabled={
              loading ||
              !message.trim()
            }
            className="min-h-12 rounded-xl bg-amber-500 px-6 font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
          >
            {loading
              ? "Odotetaan"
              : "Lähetä"}
          </button>
        </div>

        <p className="mt-2 px-1 text-xs text-neutral-600">
          Enter lähettää • Shift +
          Enter tekee uuden rivin
        </p>
      </footer>
    </div>
  )
}


export default ChatPanel
