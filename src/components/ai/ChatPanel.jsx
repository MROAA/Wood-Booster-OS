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

import { apiGet, apiPut, apiPost, apiDelete } from "../../api/client"

import { NON_TERMINAL_SET_STATUSES } from "../devstudio/statusLabels"

import { useElapsedSeconds } from "../devstudio/useElapsedSeconds"

import { useApprovePlanProgress } from "../devstudio/useApprovePlanProgress"

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

// Palvelin laskee useamman laatutarkistuksen jokaiselle vastaukselle
// (ks. server/services/aiBrain.js:collectAnswerQualityWarnings), mutta
// osa niistä (tyyli, brändi-identiteetti) on tarkoitettu Spacemonkeyn
// omaan sävyyn, ei tosiasioiden luotettavuuteen - näytetään käyttäjälle
// vain ne tyypit jotka oikeasti liittyvät hallusinaatioon/luotettavuu-
// teen, jotta varoitus ei muutu kohinaksi.
const SAFETY_WARNING_TYPES = new Set([
  "possible_hallucination",
  "possible_ungrounded_answer",
  "unsupported_workshop_claim",
  "unsupported_business_term",
  "unsupported_price",
  "unsupported_percentage",
  "unverified_action_claim",
])

function filterSafetyWarnings(qualityWarnings) {

  if (!Array.isArray(qualityWarnings)) {

    return []

  }

  return qualityWarnings.filter(
    warning => SAFETY_WARNING_TYPES.has(warning?.type),
  )

}



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



  const elapsedSeconds = useElapsedSeconds(isThinking)

  const approvePlanProgress = useApprovePlanProgress()



  const [
    busySetId,
    setBusySetId
  ] = useState(null)



  const [
    resolvingIndex,
    setResolvingIndex
  ] = useState(null)



  const [
    previewingSetId,
    setPreviewingSetId
  ] = useState(null)



  const [
    previewBusySetId,
    setPreviewBusySetId
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
        "Terve.\n\nMitäs tänään?"
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

    approvePlanProgress.start(setId, updateSetInPlace)

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/approve-plan`)

      updateSetInPlace(set)

    } catch (error) {

      console.error("Suunnitelman hyväksyntä epäonnistui:", error)

    } finally {

      approvePlanProgress.stop(setId)

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



  async function startPreviewForSet(setId) {

    setPreviewBusySetId(setId)

    try {

      const result = await apiPost(`/dev-draft-sets/${setId}/preview`)

      window.open(result.url, "_blank")

      setPreviewingSetId(setId)

    } catch (error) {

      console.error("Esikatselun käynnistys epäonnistui:", error)

    } finally {

      setPreviewBusySetId(null)

    }

  }



  async function stopPreviewForSet(setId) {

    setPreviewBusySetId(setId)

    try {

      await apiDelete(`/dev-draft-sets/${setId}/preview`)

    } catch (error) {

      console.error("Esikatselun pysäytys epäonnistui:", error)

    } finally {

      setPreviewingSetId(null)

      setPreviewBusySetId(null)

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

    async function restoreHistoryAndPendingSets() {

      try {

        const data = await fetch("http://localhost:3001/api/agents/history?limit=50")
          .then(response => response.json())

        const history = data.history || []

        if (history.length > 0) {

          setMessages(
            history.map(entry => ({
              role: entry.role,
              kind: "text",
              content: entry.content,
              mode: entry.mode,
            }))
          )

        }

      } catch (error) {

        console.error(
          "Keskusteluhistorian lataus epäonnistui:",
          error
        )

      }

      // Jatketaan SAMAA efektiä (ei erillistä useEffectiä) - jos tämä
      // olisi oma efektinsä, sen ja yllä olevan historia-fetchin
      // järjestys olisi arvaamaton, ja jos historia ehtisi ratketa
      // jälkikäteen, sen setMessages-korvaus pyyhkisi juuri palautetut
      // pakettikuplat pois.
      try {

        const sets = await apiGet("/dev-draft-sets")

        const restored = (sets || [])
          .filter(set => NON_TERMINAL_SET_STATUSES.has(set.status))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map(set => ({ role: "assistant", kind: "set", set, restored: true }))

        if (restored.length === 0) {
          return
        }

        setMessages(previous => [
          ...previous,
          ...restored.filter(
            item => !previous.some(
              existing => existing.kind === "set" && existing.set.id === item.set.id
            )
          ),
        ])

      } catch (error) {

        console.error(
          "Keskeneräisten suunnitelmien palautus epäonnistui:",
          error
        )

      }

    }

    restoreHistoryAndPendingSets()

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
                safetyWarnings:
                  filterSafetyWarnings(data.debug?.qualityWarnings),
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

      {/* Chatin oma taustakuva - viestikuplat käyttävät bg-gradient-to-br-
          utiliteetteja (from-[...]/to-[...]), jotka asettavat oman
          background-image:nsa, joten index.css:n yleinen paneelisääntö ei
          koskaan yllä niihin (eri elementti kilpailisi samasta
          ominaisuudesta). Sen sijaan kuva laitetaan tämän paneelin omaan
          taustaan, kuplien takana - Marc: "kuva tulee myös chatin
          taustakuvaksi". Sama tumma peittoväri+kuva-tekniikka kuin
          index.css:n paneelisäännössä, jotta teksti pysyy luettavana. */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
        "
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,18,16,0.45), rgba(20,18,16,0.45)), url('/branding/panel-texture.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden="true"
      />

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

                    <div className="flex flex-col gap-1">

                      {
                        item.restored && NON_TERMINAL_SET_STATUSES.has(item.set.status) && (
                          <div className="text-xs italic text-[var(--wood-muted)]">
                            Aiemmin aloitettu, ei vielä valmis.
                          </div>
                        )
                      }

                      <SetBubble
                        set={item.set}
                        busy={busySetId === item.set.id}
                        onApprovePlan={() => approvePlan(item.set.id)}
                        onApprove={() => approveSet(item.set.id)}
                        onReject={() => rejectSet(item.set.id)}
                        onWrite={() => writeSet(item.set.id)}
                        onReviseFile={(fileId, feedback) => reviseFile(item.set.id, fileId, feedback)}
                        onPreview={() => startPreviewForSet(item.set.id)}
                        onStopPreview={() => stopPreviewForSet(item.set.id)}
                        previewing={previewingSetId === item.set.id}
                        previewBusy={previewBusySetId === item.set.id}
                      />

                    </div>

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

                      {
                        item.safetyWarnings?.length > 0 && (

                          <div className="mt-2 space-y-1">

                            {
                              item.safetyWarnings.map(
                                (warning, warningIndex) => (

                                  <div
                                    key={warningIndex}
                                    className="text-xs text-amber-400"
                                  >
                                    ⚠ {warning.message}
                                  </div>

                                )
                              )
                            }

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

                <span className="text-[10px] text-[var(--wood-muted)] ml-1">
                  {elapsedSeconds}s
                </span>

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
