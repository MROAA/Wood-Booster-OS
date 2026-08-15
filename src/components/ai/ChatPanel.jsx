import {
  useEffect,
  useRef,
  useState
} from "react"


import SpacemonkeyIcon from "../branding/SpacemonkeyIcon"

import SetBubble from "../devstudio/SetBubble"

import { apiPut } from "../../api/client"

import {
  createRuntimeContext,
} from "../../services/runtime/runtimeContext"



const MODE_SENDER = {
  spacemonkey: "Spacemonkey",
  altrako: "Altrako",
  council: "Council (Spacemonkey + Altrako)",
  koodi: "Dev Studio",
}

const KOODI_PREFIX_PATTERN = /^\/koodi\s*/i



function ChatPanel() {


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





  async function sendMessage() {


    if (!message.trim()) {
      return
    }



    const userText = message



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

      const response =
        await fetch(
          "http://localhost:3001/api/agents/chat",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              message: userText,
              runtimeContext: createRuntimeContext(),
            })

          }
        )



      const data =
        await response.json()



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
                    />

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
