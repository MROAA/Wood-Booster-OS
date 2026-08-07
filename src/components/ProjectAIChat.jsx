import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  useNavigate,
} from "react-router-dom"

import {
  apiPost,
  apiPut,
} from "../api/client"

import {
  useProjectAI,
} from "./ProjectAIContext"

import {
  buildProjectContext,
} from "../services/projectContextBuilder"

import {
  dispatchAIActions,
  hasAIActions,
} from "../services/aiActionDispatcher"


function ProjectAIChat() {
  const navigate =
    useNavigate()

  const {
    context,
    loading: contextLoading,
    error: contextError,
    updateProject,
  } = useProjectAI()

  const [message, setMessage] =
    useState("")

  const [messages, setMessages] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [debug, setDebug] =
    useState(null)

  const [
    actionStatus,
    setActionStatus,
  ] = useState(null)

  const [
    savingMessageIndex,
    setSavingMessageIndex,
  ] = useState(null)

  const [
    savedMessageIndexes,
    setSavedMessageIndexes,
  ] = useState([])

  const messagesEndRef =
    useRef(null)


  useEffect(() => {
    setMessage("")
    setMessages([])
    setLoading(false)
    setError("")
    setDebug(null)
    setActionStatus(null)
    setSavingMessageIndex(null)
    setSavedMessageIndexes([])
  }, [context.project?.id])


  useEffect(() => {
    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      })
  }, [
    messages,
    loading,
    error,
    actionStatus,
  ])


  async function sendMessage() {
    const question =
      message.trim()

    if (
      !question ||
      loading ||
      contextLoading
    ) {
      return
    }

    if (!context.project?.id) {
      setError(
        "Projektitietoa ei ole ladattu.",
      )

      return
    }

    const userMessage = {
      role: "user",
      content: question,
    }

    const conversation = [
      ...messages,
      userMessage,
    ]

    setMessages(conversation)
    setMessage("")
    setLoading(true)
    setError("")
    setActionStatus(null)

    try {
      const aiContext =
        buildProjectContext({
          project:
            context.project,

          memory:
            context.memory,

          knowledge:
            context.knowledge,

          conversation,

          question,
        })

      const response =
        await apiPost(
          "/agents/chat",
          {
            message:
              aiContext,

            conversation,

            runtimeContext: {
              activeProject: {
                id:
                  context.project.id,

                name:
                  context.project.name ||
                  null,

                status:
                  context.project.status ||
                  null,
              },

              activeCustomer:
                context.project.customer ||
                null,

              activeTab: {
                id: "ai",
                label:
                  "AI Assistant",
                scope:
                  "project",
                projectId:
                  context.project.id,
              },
            },
          },
        )

      const answer =
        response?.answer ||
        response?.response ||
        response?.message

      if (!answer) {
        throw new Error(
          response?.error ||
          "AI ei palauttanut vastausta.",
        )
      }

      setDebug({
        agent:
          response?.agent ||
          "Tuntematon",

        reason:
          response?.reason ||
          "Ei reititystietoa",

        debug:
          response?.debug ||
          null,

        actions:
          response?.actions ||
          response?.action ||
          null,
      })

      setMessages(
        (previous) => [
          ...previous,
          {
            role:
              "assistant",

            content:
              answer,
          },
        ],
      )

      if (
        hasAIActions(response)
      ) {
        setActionStatus({
          type: "running",
          message:
            "AI-toimintoa suoritetaan...",
        })

        const actionResult =
          await dispatchAIActions({
            response,
            navigate,
            stopOnError: false,

            onActionStart:
              ({ action }) => {
                setActionStatus({
                  type: "running",
                  message:
                    createActionStartMessage(
                      action,
                    ),
                })
              },

            onActionComplete:
              ({ result }) => {
                if (!result) {
                  return
                }

                setActionStatus({
                  type:
                    result.success
                      ? "success"
                      : "error",

                  message:
                    result.message ||
                    (
                      result.success
                        ? "AI-toiminto suoritettiin."
                        : "AI-toiminto epäonnistui."
                    ),
                })
              },
          })

        const resultMessage =
          createQueueResultMessage(
            actionResult,
          )

        setActionStatus({
          type:
            actionResult?.success
              ? "success"
              : "error",

          message:
            resultMessage,
        })
      }
    } catch (sendError) {
      console.error(
        "Project AI chat error:",
        sendError,
      )

      setError(
        sendError?.message ||
        "AI-viestin lähettäminen epäonnistui.",
      )
    } finally {
      setLoading(false)
    }
  }


  async function saveAnswerToNotes(
    answer,
    messageIndex,
  ) {
    if (
      !answer ||
      savingMessageIndex !== null
    ) {
      return
    }

    const project =
      context.project

    if (!project?.id) {
      setError(
        "Projektia ei voitu tunnistaa.",
      )

      return
    }

    setSavingMessageIndex(
      messageIndex,
    )

    setError("")

    try {
      const currentNotes =
        String(
          project.notes || "",
        ).trim()

      const savedAt =
        new Date()
          .toLocaleString("fi-FI")

      const noteEntry = `
AI ASSISTANT
${savedAt}

${answer}
`.trim()

      const updatedNotes =
        currentNotes
          ? `${currentNotes}

--------------------

${noteEntry}`
          : noteEntry

      const response =
        await apiPut(
          `/projects/${project.id}`,
          {
            notes:
              updatedNotes,
          },
        )

      const updatedProject =
        response?.project ||
        response

      if (
        !updatedProject ||
        !updatedProject.id
      ) {
        throw new Error(
          "Backend ei palauttanut päivitettyä projektia.",
        )
      }

      updateProject(
        updatedProject,
      )

      setSavedMessageIndexes(
        (previous) => [
          ...previous,
          messageIndex,
        ],
      )
    } catch (saveError) {
      console.error(
        "AI answer save error:",
        saveError,
      )

      setError(
        saveError?.message ||
        "AI-vastauksen tallentaminen epäonnistui.",
      )
    } finally {
      setSavingMessageIndex(
        null,
      )
    }
  }


  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()
      sendMessage()
    }
  }


  function clearConversation() {
    if (
      loading ||
      savingMessageIndex !== null
    ) {
      return
    }

    setMessages([])
    setError("")
    setDebug(null)
    setActionStatus(null)
    setSavedMessageIndexes([])
  }


  if (contextLoading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">

        <p className="text-neutral-400">
          Valmistellaan AI-kontekstia...
        </p>

      </div>
    )
  }


  return (
    <div className="space-y-5">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <h2 className="text-xl font-bold">
            △ Project AI Assistant
          </h2>

          <p className="mt-2 text-neutral-400">
            Keskustele projektista ja pyydä AI:ta
            suorittamaan käyttöliittymän toimintoja.
          </p>

        </div>


        {messages.length > 0 && (
          <button
            type="button"
            onClick={
              clearConversation
            }
            disabled={
              loading ||
              savingMessageIndex !== null
            }
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-400 transition hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tyhjennä keskustelu
          </button>
        )}

      </div>


      {contextError && (
        <div className="rounded-2xl border border-amber-800 bg-amber-950/30 p-4">

          <p className="font-semibold text-amber-300">
            Osa AI-kontekstista puuttuu
          </p>

          <p className="mt-2 text-sm text-amber-200">
            {contextError}
          </p>

          <p className="mt-2 text-sm text-neutral-400">
            Projektikeskustelua voi silti käyttää
            projektitiedoilla.
          </p>

        </div>
      )}


      <div className="h-[30rem] space-y-4 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-4">

        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">

            <div className="max-w-md">

              <div className="text-4xl">
                ◇
              </div>

              <p className="mt-4 font-semibold">
                Kysy tästä projektista
              </p>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Voit keskustella projektista tai pyytää
                AI:ta avaamaan projektin välilehden.
              </p>

              <div className="mt-5 space-y-2 text-left text-sm text-neutral-500">

                <p>
                  Esimerkki: Avaa projektin Notes.
                </p>

                <p>
                  Esimerkki: Avaa projektin Knowledge.
                </p>

                <p>
                  Esimerkki: Mitä tästä projektista puuttuu?
                </p>

              </div>

            </div>

          </div>
        )}


        {messages.map(
          (item, index) => {
            const isUser =
              item.role === "user"

            const isSaved =
              savedMessageIndexes.includes(
                index,
              )

            const isSaving =
              savingMessageIndex ===
              index

            return (
              <div
                key={`${item.role}-${index}`}
                className={
                  isUser
                    ? "text-right"
                    : "text-left"
                }
              >

                <div
                  className={`
                    inline-block
                    max-w-[85%]
                    whitespace-pre-wrap
                    break-words
                    rounded-2xl
                    px-4
                    py-3
                    text-left
                    leading-7

                    ${
                      isUser
                        ? "bg-amber-500 text-black"
                        : "bg-neutral-800 text-white"
                    }
                  `}
                >
                  {item.content}
                </div>


                {!isUser && (
                  <div className="mt-2">

                    <button
                      type="button"
                      onClick={() =>
                        saveAnswerToNotes(
                          item.content,
                          index,
                        )
                      }
                      disabled={
                        isSaving ||
                        isSaved ||
                        savingMessageIndex !== null
                      }
                      className={`
                        rounded-lg
                        border
                        px-3
                        py-2
                        text-xs
                        font-semibold
                        transition
                        disabled:cursor-not-allowed
                        disabled:opacity-60

                        ${
                          isSaved
                            ? "border-green-800 bg-green-950/40 text-green-300"
                            : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-amber-500 hover:text-amber-400"
                        }
                      `}
                    >
                      {isSaving
                        ? "Tallennetaan..."
                        : isSaved
                          ? "✓ Tallennettu Notesiin"
                          : "Tallenna Notesiin"}
                    </button>

                  </div>
                )}

              </div>
            )
          },
        )}


        {loading && (
          <div className="text-left">

            <div className="inline-block rounded-2xl bg-neutral-800 px-4 py-3 text-neutral-400">
              AI ajattelee...
            </div>

          </div>
        )}


        {actionStatus && (
          <ActionStatusCard
            status={actionStatus}
          />
        )}


        {error && (
          <div className="rounded-2xl border border-red-900 bg-red-950/40 p-4">

            <p className="font-semibold text-red-300">
              Toiminto epäonnistui
            </p>

            <p className="mt-2 text-sm text-red-200">
              {error}
            </p>

          </div>
        )}


        <div ref={messagesEndRef} />

      </div>


      <div className="flex flex-col gap-3 sm:flex-row">

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(
              event.target.value,
            )
          }
          onKeyDown={
            handleKeyDown
          }
          rows={3}
          disabled={
            loading ||
            contextLoading
          }
          placeholder="Kysy projektista tai anna toiminto..."
          className="min-h-24 flex-1 resize-y rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
        />


        <button
          type="button"
          onClick={
            sendMessage
          }
          disabled={
            loading ||
            contextLoading ||
            !message.trim()
          }
          className="rounded-xl bg-amber-500 px-6 py-3 font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
        >
          {loading
            ? "Lähetetään..."
            : "Lähetä"}
        </button>

      </div>


      <p className="text-xs text-neutral-600">
        Enter lähettää. Shift + Enter tekee uuden rivin.
      </p>


      {debug && (
        <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm">

          <div className="flex flex-wrap gap-x-6 gap-y-2">

            <p>
              Agent:
              {" "}
              <span className="font-semibold text-neutral-200">
                {debug.agent}
              </span>
            </p>

            <p>
              Reason:
              {" "}
              <span className="text-neutral-300">
                {debug.reason}
              </span>
            </p>

          </div>


          {debug.actions && (
            <details>

              <summary className="cursor-pointer text-neutral-400">
                AI Actions
              </summary>

              <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words text-xs text-neutral-400">
                {JSON.stringify(
                  debug.actions,
                  null,
                  2,
                )}
              </pre>

            </details>
          )}


          {debug.debug && (
            <details>

              <summary className="cursor-pointer text-neutral-400">
                Raw debug
              </summary>

              <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words text-xs text-neutral-400">
                {JSON.stringify(
                  debug.debug,
                  null,
                  2,
                )}
              </pre>

            </details>
          )}

        </div>
      )}

    </div>
  )
}


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
        : "border-amber-800 bg-amber-950/30 text-amber-200"

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


export default ProjectAIChat
