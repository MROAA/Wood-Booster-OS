import {
  useEffect,
  useRef,
  useState
} from "react"

import {
  useNavigate,
} from "react-router-dom"


import SpacemonkeyIcon from "../branding/SpacemonkeyIcon"

import SetBubble from "../devstudio/SetBubble"

import ActionStatusCard, {
  createActionStartMessage,
  createQueueResultMessage,
} from "./ActionStatusCard"

import { apiPut } from "../../api/client"

import {
  createRuntimeContext,
} from "../../services/runtime/runtimeContext"

import SecurityGuard from "../spacemonkey/SecurityGuard"

import {
  getSystemContextPayload,
} from "../../services/system/systemRegistry"

import {
  dispatchAIActions,
  hasAIActions,
} from "../../services/aiActionDispatcher"



const MODE_SENDER = {
  spacemonkey: "Spacemonkey",
  altrako: "Altrako",
  council: "Council (Spacemonkey + Altrako)",
  koodi: "Dev Studio",
}

const KOODI_PREFIX_PATTERN = /^\/koodi\s*/i

const EXAMPLE_PROMPTS = [
  "Luo uusi projekti Matti Meikäläiselle",
  "/koodi lisää uusi sivu",
  "Mitä tehtäviä on avoinna?",
]



function ChatPanel() {


  const navigate = useNavigate()



  const [
    actionStatus,
    setActionStatus
  ] = useState(null)



  const [
    message,
    setMessage
  ] = useState("")



  const [
    isThinking,
    setIsThinking
  ] = useState(false)



  const [
    busySetId,
    setBusySetId
  ] = useState(null)



  const [
    resolvingIndex,
    setResolvingIndex
  ] = useState(null)



  const inputRef = useRef(null)

  const isKoodiActive = KOODI_PREFIX_PATTERN.test(message)



  function toggleKoodiMode() {

    setMessage(
      previous =>
        KOODI_PREFIX_PATTERN.test(previous)
          ? previous.replace(KOODI_PREFIX_PATTERN, "")
          : "/koodi " + previous
    )

    inputRef.current?.focus()

  }



  function fillExamplePrompt(example) {

    setMessage(example)

    inputRef.current?.focus()

  }



  const [
    messages,
    setMessages
  ] = useState([

    {
      role: "assistant",
      kind: "text",
      content:
        "Terve.\n\nMitäs tänään? (Vinkki: λ-napista pääset " +
        "ehdottamaan muutosta itse järjestelmään.)"
    }

  ])

  const isPristine = messages.length === 1



  function updateSetInPlace(set) {

    setMessages(
      previous =>
        previous.map(
          item =>
            item.kind === "set" && item.set.id === set.id
              ? { ...item, set }
              : item,
        ),
    )

  }



  async function approvePlan(setId) {

    setBusySetId(setId)

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/approve-plan`)

      updateSetInPlace(set)

    } catch (error) {

      console.error("Suunnitelman hyväksyntä epäonnistui:", error)

    } finally {

      setBusySetId(null)

    }

  }



  async function approveSet(setId) {

    setBusySetId(setId)

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/approve`)

      updateSetInPlace(set)

    } catch (error) {

      console.error("Paketin hyväksyntä epäonnistui:", error)

    } finally {

      setBusySetId(null)

    }

  }



  async function rejectSet(setId) {

    setBusySetId(setId)

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/reject`)

      updateSetInPlace(set)

    } catch (error) {

      console.error("Paketin hylkäys epäonnistui:", error)

    } finally {

      setBusySetId(null)

    }

  }



  async function reviseFile(setId, fileId, feedback) {

    setBusySetId(setId)

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/files/${fileId}/revise`, { feedback })

      updateSetInPlace(set)

    } catch (error) {

      console.error("Muutospyyntö epäonnistui:", error)

    } finally {

      setBusySetId(null)

    }

  }



  async function writeSet(setId) {

    setBusySetId(setId)

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/write`)

      updateSetInPlace(set)

    } catch (error) {

      console.error("Kirjoitus epäonnistui:", error)

      try {

        const refreshed = await fetch(
          `http://localhost:3001/api/dev-draft-sets/${setId}`,
        ).then(response => response.json())

        updateSetInPlace(refreshed)

      } catch {

        // ei väliä, virhe on jo lokitettu yllä

      }

    } finally {

      setBusySetId(null)

    }

  }



  useEffect(() => {

    fetch("http://localhost:3001/api/agents/history?limit=50")

      .then(response => response.json())

      .then(data => {

        const history = data.history || []

        if (history.length === 0) {
          return
        }

        setMessages(
          history.map(entry => ({
            role: entry.role,
            kind: "text",
            content: entry.content,
            mode: entry.mode,
          }))
        )

      })

      .catch(error => {

        console.error(
          "Keskusteluhistorian lataus epäonnistui:",
          error
        )

      })

  }, [])





  async function postChatMessage(payload) {

    const response =
      await fetch(
        "http://localhost:3001/api/agents/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload)

        }
      )

    return response.json()

  }



  function appendAssistantReply(data) {

    setMessages(
      previous => [

        ...previous,

        data.kind === "code_plan"
          ? {
              role: "assistant",
              kind: "set",
              mode: data.mode,
              set: data.draftSet,
            }
          : data.kind === "confirm_koodi"
            ? {
                role: "assistant",
                kind: "confirm_koodi",
                content: data.answer,
                originalText: data.originalText,
                resolved: false,
              }
            : {
                role: "assistant",
                kind: "text",
                content:
                  data.answer ||
                  "Ei vastausta.",
                mode:
                  data.mode,
                innerVoice:
                  data.innerVoice,
              }

      ]
    )

  }



  async function runActionsIfAny(data) {

    if (!hasAIActions(data)) {

      return

    }

    setActionStatus({
      type: "running",
      message: "AI-toimintoa suoritetaan...",
    })

    const actionResult =
      await dispatchAIActions({

        response: data,

        navigate,

        stopOnError: false,

        onActionStart:
          ({ action }) => {

            setActionStatus({
              type: "running",
              message: createActionStartMessage(action),
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

    setActionStatus({
      type:
        actionResult?.success
          ? "success"
          : "error",
      message: createQueueResultMessage(actionResult),
    })

  }



  async function sendMessage() {


    if (!message.trim()) {
      return
    }



    const validation =
      SecurityGuard.validateChatInput(message)

    if (!validation.valid) {

      setMessages(
        previous => [

          ...previous,

          {
            role: "assistant",
            kind: "text",
            content: validation.message
          }

        ]
      )

      return

    }



    const userText = validation.message



    setMessages(
      previous => [

        ...previous,

        {
          role: "user",
          kind: "text",
          content: userText
        }

      ]
    )



    setMessage("")

    setIsThinking(true)



    try {

      const data =
        await postChatMessage({
          message: userText,
          runtimeContext: createRuntimeContext(),
          systemContext: getSystemContextPayload(),
        })

      appendAssistantReply(data)

      await runActionsIfAny(data)


    } catch(error) {


      setMessages(
        previous => [

          ...previous,

          {
            role: "assistant",
            kind: "text",
            content:
              "Yhteys Spacemonkeyhin epäonnistui."
          }

        ]
      )

    } finally {

      setIsThinking(false)

    }


  }



  async function resolveCodeIntent(index, originalText, confirmed) {

    setResolvingIndex(index)

    setMessages(
      previous =>
        previous.map(
          (item, itemIndex) =>
            itemIndex === index
              ? { ...item, resolved: true }
              : item,
        ),
    )

    setIsThinking(true)



    try {

      const data =
        await postChatMessage(
          confirmed
            ? {
                message: "/koodi " + originalText,
                runtimeContext: createRuntimeContext(),
                systemContext: getSystemContextPayload(),
              }
            : {
                message: originalText,
                skipCodeDetection: true,
                runtimeContext: createRuntimeContext(),
                systemContext: getSystemContextPayload(),
              }
        )

      appendAssistantReply(data)

      await runActionsIfAny(data)

    } catch(error) {

      setMessages(
        previous => [

          ...previous,

          {
            role: "assistant",
            kind: "text",
            content:
              "Yhteys Spacemonkeyhin epäonnistui."
          }

        ]
      )

    } finally {

      setIsThinking(false)

      setResolvingIndex(null)

    }

  }





  return (

    <div
      className="
        relative
        h-full
        min-h-0
        flex
        flex-col
      "
    >

      {/* Hyvin himmeä lämmin hehku taustalla - antaa paneelille syvyyttä
          ilman että se kilpailee viestien kanssa huomiosta. */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          opacity-40
        "
        style={{
          background:
            "radial-gradient(circle at 15% 0%, rgba(107,127,74,0.10), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div
        className="
          wood-scroll
          flex-1
          min-h-0
          overflow-y-auto
          p-5
          space-y-4
        "
      >

        {
          messages.map(
            (item,index) => (

              <div
                key={index}
                className="
                  message-appear
                  flex
                  gap-3
                  items-start
                "
              >


                {
                  item.role === "assistant" && (

                    <div
                      className="
                        soft-glow
                        shrink-0
                        rounded-lg
                      "
                    >

                      <SpacemonkeyIcon />

                    </div>

                  )
                }



                {
                  item.kind === "set" ? (

                    <SetBubble
                      set={item.set}
                      busy={busySetId === item.set.id}
                      onApprovePlan={() => approvePlan(item.set.id)}
                      onApprove={() => approveSet(item.set.id)}
                      onReject={() => rejectSet(item.set.id)}
                      onWrite={() => writeSet(item.set.id)}
                      onReviseFile={(fileId, feedback) => reviseFile(item.set.id, fileId, feedback)}
                    />

                  ) : item.kind === "confirm_koodi" ? (

                    <div
                      className="
                        max-w-[90%]
                        rounded-2xl
                        rounded-bl-md
                        border
                        border-[var(--wood-border)]
                        bg-gradient-to-br
                        from-[var(--wood-panel)]
                        to-[var(--wood-card)]
                        px-4
                        py-3
                        text-sm
                        leading-relaxed
                        text-[var(--wood-text)]
                        shadow-sm
                      "
                    >

                      {item.content}

                      <div className="flex gap-2 pt-2">

                        <button
                          disabled={item.resolved || resolvingIndex === index}
                          onClick={() => resolveCodeIntent(index, item.originalText, true)}
                          className="
                            rounded-full
                            px-4
                            py-1.5
                            text-xs
                            font-medium
                            bg-[var(--wood-accent)]
                            text-[#17120c]
                            transition-opacity
                            disabled:opacity-30
                            disabled:cursor-not-allowed
                            hover:opacity-90
                          "
                        >
                          Kyllä, tee suunnitelma
                        </button>

                        <button
                          disabled={item.resolved || resolvingIndex === index}
                          onClick={() => resolveCodeIntent(index, item.originalText, false)}
                          className="
                            rounded-full
                            border
                            border-[var(--wood-border)]
                            px-4
                            py-1.5
                            text-xs
                            font-medium
                            text-[var(--wood-muted)]
                            transition-opacity
                            disabled:opacity-30
                            disabled:cursor-not-allowed
                            hover:text-[var(--wood-text)]
                          "
                        >
                          Ei, tavallinen viesti
                        </button>

                      </div>

                    </div>

                  ) : (

                    <div
                      className={`
                        max-w-[90%]
                        px-4
                        py-3
                        text-sm
                        leading-relaxed
                        whitespace-pre-line
                        shadow-sm

                        ${
                          item.role === "user"

                          ?

                          "ml-auto rounded-2xl rounded-br-md bg-[var(--wood-accent)] text-[#17120c]"

                          :

                          "rounded-2xl rounded-bl-md border border-[var(--wood-border)] bg-gradient-to-br from-[var(--wood-panel)] to-[var(--wood-card)] text-[var(--wood-text)]"

                        }

                      `}
                    >

                      {
                        item.role === "assistant" &&
                        item.mode &&
                        MODE_SENDER[item.mode] && (

                          <div
                            className="
                              mb-1
                              text-xs
                              font-semibold
                              uppercase
                              tracking-wide
                              text-[var(--wood-accent)]
                            "
                          >

                            {MODE_SENDER[item.mode]}

                          </div>

                        )
                      }

                      {item.content}

                      {
                        item.innerVoice && (

                          /* Spacemonkeyn "sisäinen ääni" - tunnelmaa, ei
                             järjestelmätietoa, siksi selvästi omalla,
                             hillityllä tyylillään erillään vastauksesta. */
                          <div
                            className="
                              mt-2
                              text-xs
                              italic
                              text-[var(--wood-muted)]
                            "
                          >

                            {item.innerVoice.mood}
                            {" — "}
                            {item.innerVoice.innerThought}

                          </div>

                        )
                      }

                    </div>

                  )
                }


              </div>

            )
          )
        }


        {
          isThinking && (

            <div
              className="
                message-appear
                flex
                gap-3
                items-start
              "
            >

              <div
                className="
                  soft-glow
                  shrink-0
                  rounded-lg
                "
              >

                <SpacemonkeyIcon />

              </div>



              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  rounded-2xl
                  rounded-bl-md
                  px-4
                  py-3.5
                  border
                  border-[var(--wood-border)]
                  bg-[var(--wood-panel)]
                "
              >

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[var(--wood-accent)]
                    animate-bounce
                  "
                  style={{ animationDelay: "0ms" }}
                />

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[var(--wood-accent)]
                    animate-bounce
                  "
                  style={{ animationDelay: "120ms" }}
                />

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[var(--wood-accent)]
                    animate-bounce
                  "
                  style={{ animationDelay: "240ms" }}
                />

              </div>


            </div>

          )
        }


        {
          actionStatus && (
            <ActionStatusCard status={actionStatus} />
          )
        }


      </div>





      <div
        className="
          shrink-0
          p-4
          border-t
          border-[var(--wood-border)]
          bg-[var(--wood-panel)]
        "
      >

        {
          isPristine && (

            <div
              className="
                flex
                flex-wrap
                gap-2
                pb-3
              "
            >

              {
                EXAMPLE_PROMPTS.map(
                  (example, exampleIndex) => (

                    <button
                      key={exampleIndex}
                      onClick={() => fillExamplePrompt(example)}
                      className="
                        rounded-full
                        border
                        border-[var(--wood-border)]
                        px-3
                        py-1
                        text-xs
                        text-[var(--wood-muted)]
                        transition-colors
                        hover:border-[var(--wood-accent)]
                        hover:text-[var(--wood-text)]
                      "
                    >
                      {example}
                    </button>

                  )
                )
              }

            </div>

          )
        }

        <div
          className="
            flex
            gap-3
          "
        >

          <button

            onClick={toggleKoodiMode}

            title="Koodimuutostila - ehdota muutos järjestelmään"

            aria-pressed={isKoodiActive}

            className={`
              h-12
              w-12
              shrink-0
              rounded-full
              border
              text-lg
              font-medium
              transition-colors
              duration-200

              ${
                isKoodiActive

                ?

                "border-[var(--wood-accent)] bg-[var(--wood-accent)]/15 text-[var(--wood-accent)]"

                :

                "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"

              }
            `}

          >

            λ

          </button>

          <input

            ref={inputRef}

            value={message}

            onChange={
              event =>
                setMessage(
                  event.target.value
                )
            }


            onKeyDown={
              event => {

                if (
                  event.key === "Enter"
                ) {

                  sendMessage()

                }

              }
            }


            placeholder="Kirjoita viesti Spacemonkeylle..."


            className="
              flex-1
              h-12
              rounded-full
              px-5
              bg-[var(--wood-bg)]
              border
              border-[var(--wood-border)]
              text-sm
              text-[var(--wood-text)]
              placeholder:text-[var(--wood-muted)]
              outline-none
              transition-shadow
              duration-200
              focus:border-[var(--wood-accent)]
              focus:shadow-[0_0_0_3px_rgba(107,127,74,0.15)]
            "

          />



          <button

            onClick={sendMessage}

            className="
              h-12
              px-8
              rounded-full
              bg-[var(--wood-accent)]
              text-[#17120c]
              font-medium
              transition-all
              duration-200
              ease-out
              hover:scale-[1.03]
              hover:opacity-90
              active:scale-95
            "

          >

            Lähetä  ➤

          </button>


        </div>


      </div>


    </div>

  )

}


export default ChatPanel
