import { useState } from "react"

import SpacemonkeyIcon from "../branding/SpacemonkeyIcon"

import { apiPost, apiPut } from "../../api/client"

import { useDesktop } from "../../context/DesktopContext"

import DiffView from "./DiffView"

const STATUS_LABELS = {

  draft: "Odottaa hyväksyntää",

  approved: "Hyväksytty",

  rejected: "Hylätty",

  written: "Kirjoitettu levylle",

  write_failed: "Kirjoitus epäonnistui",

  conflict: "Tiedosto muuttunut",

}

const TEST_STATUS_DISPLAY = {

  passed: { icon: "✓", label: "Testi läpäisi", className: "text-emerald-400" },

  failed: { icon: "✗", label: "Testi epäonnistui", className: "text-red-400" },

  timeout: { icon: "⏱", label: "Testi aikakatkaistiin", className: "text-amber-400" },

  error: { icon: "⚠", label: "Tarkistus epäonnistui", className: "text-amber-400" },

  skipped: { icon: "—", label: "Ei toiminnallista testiä", className: "text-[var(--wood-muted)]" },

}

function TestStatusLine({ draft }) {

  const display = TEST_STATUS_DISPLAY[draft.testStatus]

  if (!display) {

    return null

  }

  return (

    <div className={`text-xs ${display.className}`}>

      {display.icon} {display.label}

      {
        draft.testStatus === "skipped" && draft.testSkippedReason && (
          <span className="text-[var(--wood-muted)]"> — {draft.testSkippedReason}</span>
        )
      }

      {
        (draft.testStatus === "failed" || draft.testStatus === "timeout" || draft.testStatus === "error") &&
        draft.testOutput && (
          <pre
            className="
              wood-scroll
              mt-1
              max-h-40
              overflow-auto
              rounded-lg
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-2
              text-[11px]
              leading-relaxed
              whitespace-pre-wrap
              text-[var(--wood-muted)]
            "
          >
            {draft.testOutput}
          </pre>
        )
      }

    </div>

  )

}

function ProposalBubble({ draft, onApprove, onReject, onWrite, busy }) {

  const status = draft.status

  return (

    <div
      className="
        max-w-[95%]
        rounded-2xl
        rounded-bl-md
        border
        border-[var(--wood-border)]
        bg-gradient-to-br
        from-[var(--wood-panel)]
        to-[var(--wood-card)]
        p-4
        space-y-3
        text-sm
        text-[var(--wood-text)]
      "
    >

      <div className="flex items-center justify-between gap-2">

        <div className="font-medium">{draft.title || "Koodimuutos"}</div>

        <span
          className="
            shrink-0
            rounded-full
            border
            border-[var(--wood-border)]
            px-2.5
            py-0.5
            text-xs
            text-[var(--wood-muted)]
          "
        >
          {STATUS_LABELS[status] || status}
        </span>

      </div>

      <div className="text-xs text-[var(--wood-muted)]">
        {draft.filePath}
      </div>

      {
        draft.explanation && (
          <div className="text-sm leading-relaxed">
            {draft.explanation}
          </div>
        )
      }

      <DiffView diff={draft.diff} />

      <TestStatusLine draft={draft} />

      {
        draft.writeError && (
          <div className="text-xs text-red-300">
            {draft.writeError}
            {
              status === "conflict" && (
                <>
                  {" "}
                  Lähetä pyyntö uudelleen luodaksesi tuoreen luonnoksen.
                </>
              )
            }
          </div>
        )
      }

      <div className="flex gap-2 pt-1">

        <button
          disabled={status !== "draft" || busy}
          onClick={onApprove}
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
          Hyväksy
        </button>

        <button
          disabled={
            (status !== "approved" && status !== "write_failed") || busy
          }
          onClick={onWrite}
          className="
            rounded-full
            px-4
            py-1.5
            text-xs
            font-medium
            border
            border-[var(--wood-accent)]
            text-[var(--wood-accent)]
            transition-opacity
            disabled:opacity-30
            disabled:cursor-not-allowed
            hover:bg-[var(--wood-accent)]/10
          "
        >
          Kirjoita levylle
        </button>

        <button
          disabled={
            (status !== "draft" && status !== "approved") || busy
          }
          onClick={onReject}
          className="
            rounded-full
            px-4
            py-1.5
            text-xs
            font-medium
            text-[var(--wood-muted)]
            transition-opacity
            disabled:opacity-30
            disabled:cursor-not-allowed
            hover:text-red-300
          "
        >
          Hylkää
        </button>

      </div>

    </div>

  )

}

function DevChatPanel() {

  const { isDesktopActive, openApp } = useDesktop()

  const [filePath, setFilePath] = useState("")

  const [prompt, setPrompt] = useState("")

  const [isThinking, setIsThinking] = useState(false)

  const [busyDraftId, setBusyDraftId] = useState(null)

  const [errorMessage, setErrorMessage] = useState("")

  const [turns, setTurns] = useState([

    {
      role: "assistant",
      kind: "text",
      content:
        "Terve. Kerro tiedostopolku ja mitä siihen pitäisi muuttaa - " +
        "ehdotan muutoksen diffinä, enkä kirjoita mitään ennen kuin " +
        "hyväksyt sen.",
    },

  ])

  function updateDraftInPlace(draft) {

    setTurns(
      previous =>
        previous.map(
          turn =>
            turn.kind === "proposal" && turn.draft.id === draft.id
              ? { ...turn, draft }
              : turn,
        ),
    )

  }

  async function sendMessage() {

    if (!prompt.trim() || !filePath.trim()) {

      return

    }

    const userPrompt = prompt

    const userFilePath = filePath.trim()

    setTurns(
      previous => [

        ...previous,

        {
          role: "user",
          kind: "text",
          content: `[${userFilePath}] ${userPrompt}`,
        },

      ],
    )

    setPrompt("")

    setIsThinking(true)

    setErrorMessage("")

    try {

      const draft = await apiPost(
        "/dev-drafts",
        {
          prompt: userPrompt,
          filePath: userFilePath,
        },
      )

      setTurns(
        previous => [

          ...previous,

          {
            role: "assistant",
            kind: "proposal",
            draft,
          },

        ],
      )

      // Avataan tulosikkuna vain jos ollaan oikeasti työpöydällä
      // (esim. /desktop-reitin sisällä) - suoralla /dev-studio-reitillä
      // isDesktopActive on false eikä ikkunaa ole minne avata,
      // jolloin kuplassa näytetty tieto riittää yksinään.
      if (isDesktopActive) {

        openApp("devverificationviewer", {
          props: { draft },
          forceNew: true,
        })

      }

    } catch (error) {

      setTurns(
        previous => [

          ...previous,

          {
            role: "assistant",
            kind: "text",
            content: `Ehdotuksen luonti epäonnistui: ${error.message}`,
          },

        ],
      )

    } finally {

      setIsThinking(false)

    }

  }

  async function approveDraft(draftId) {

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/dev-drafts/${draftId}/approve`)

      updateDraftInPlace(draft)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function rejectDraft(draftId) {

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/dev-drafts/${draftId}/reject`)

      updateDraftInPlace(draft)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function writeDraft(draftId) {

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/dev-drafts/${draftId}/write`)

      updateDraftInPlace(draft)

    } catch (error) {

      // Odotettu poikkeustapaus (esim. ristiriita tai kirjoitusvirhe)
      // - reitti palauttaa silti luonnoksen ajantasaisen tilan
      // JSON-rungossa, mutta apiPut heittää vain tekstiviestin. Haetaan
      // siis tuore tila erikseen, jotta status-merkintä (esim.
      // "conflict") näkyy oikein kuplassa.
      try {

        const refreshed = await fetch(
          `http://localhost:3001/api/dev-drafts/${draftId}`,
        ).then(response => response.json())

        updateDraftInPlace(refreshed)

      } catch {

        // ei väliä, alla oleva virheviesti riittää

      }

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

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
          turns.map(
            (turn, index) => (

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
                  turn.role === "assistant" && (

                    <div className="soft-glow shrink-0 rounded-lg">
                      <SpacemonkeyIcon />
                    </div>

                  )
                }

                {
                  turn.kind === "text" ? (

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
                          turn.role === "user"
                            ? "ml-auto rounded-2xl rounded-br-md bg-[var(--wood-accent)] text-[#17120c]"
                            : "rounded-2xl rounded-bl-md border border-[var(--wood-border)] bg-gradient-to-br from-[var(--wood-panel)] to-[var(--wood-card)] text-[var(--wood-text)]"
                        }
                      `}
                    >

                      {turn.content}

                    </div>

                  ) : (

                    <ProposalBubble
                      draft={turn.draft}
                      busy={busyDraftId === turn.draft.id}
                      onApprove={() => approveDraft(turn.draft.id)}
                      onReject={() => rejectDraft(turn.draft.id)}
                      onWrite={() => writeDraft(turn.draft.id)}
                    />

                  )
                }

              </div>

            )
          )
        }

        {
          isThinking && (

            <div className="message-appear flex gap-3 items-start">

              <div className="soft-glow shrink-0 rounded-lg">
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
                  className="h-1.5 w-1.5 rounded-full bg-[var(--wood-accent)] animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--wood-accent)] animate-bounce"
                  style={{ animationDelay: "120ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--wood-accent)] animate-bounce"
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
          space-y-2
        "
      >

        {
          errorMessage && (
            <div className="text-xs text-red-300">{errorMessage}</div>
          )
        }

        <input

          value={filePath}

          onChange={event => setFilePath(event.target.value)}

          placeholder="Tiedostopolku (esim. src/pages/DevStudio.jsx)"

          className="
            w-full
            h-10
            rounded-full
            px-4
            bg-[var(--wood-bg)]
            border
            border-[var(--wood-border)]
            text-xs
            text-[var(--wood-text)]
            placeholder:text-[var(--wood-muted)]
            outline-none
            focus:border-[var(--wood-accent)]
          "

        />

        <div className="flex gap-3">

          <input

            value={prompt}

            onChange={event => setPrompt(event.target.value)}

            onKeyDown={
              event => {

                if (event.key === "Enter") {

                  sendMessage()

                }

              }
            }

            placeholder="Mitä tähän tiedostoon pitäisi muuttaa?"

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

            disabled={isThinking || !prompt.trim() || !filePath.trim()}

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
              disabled:opacity-40
              disabled:cursor-not-allowed
              disabled:hover:scale-100
            "

          >

            Ehdota muutosta ➤

          </button>

        </div>

      </div>

    </div>

  )

}

export default DevChatPanel
