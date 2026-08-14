import { useState } from "react"

import SpacemonkeyIcon from "../branding/SpacemonkeyIcon"

import { apiPost, apiPut } from "../../api/client"

import DiffView from "./DiffView"

const SET_STATUS_LABELS = {

  plan_ready: "Suunnitelma odottaa hyväksyntää",

  draft: "Odottaa hyväksyntää",

  approved: "Hyväksytty",

  rejected: "Hylätty",

  written: "Kirjoitettu levylle",

  partial_write_failed: "Osa epäonnistui",

}

const FILE_STATUS_LABELS = {

  blocked: "Estetty",

  planned: "Suunniteltu",

  generated: "Valmis tarkistettavaksi",

  generate_failed: "Generointi epäonnistui",

  written: "Kirjoitettu",

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

function PlanFileRow({ file }) {

  return (

    <div
      className={`
        rounded-lg
        border
        px-3
        py-2
        text-xs
        ${
          file.blocked
            ? "border-red-900 bg-red-950/20"
            : "border-[var(--wood-border)] bg-[var(--wood-bg)]"
        }
      `}
    >

      <div className="flex items-center justify-between gap-2">

        <span className="font-mono text-[var(--wood-text)]">
          {file.action === "create" ? "+ " : "~ "}
          {file.filePath}
        </span>

        {
          file.blocked && (
            <span className="text-red-400">Estetty: {file.blockedCode}</span>
          )
        }

      </div>

      {
        file.reason && (
          <div className="mt-1 text-[var(--wood-muted)]">{file.reason}</div>
        )
      }

    </div>

  )

}

function FileReviewCard({ file }) {

  const testDisplay = TEST_STATUS_DISPLAY[file.testStatus]

  return (

    <div
      className="
        rounded-lg
        border
        border-[var(--wood-border)]
        bg-[var(--wood-bg)]
        p-3
        space-y-2
      "
    >

      <div className="flex items-center justify-between gap-2">

        <span className="font-mono text-xs text-[var(--wood-text)]">
          {file.action === "create" ? "+ " : "~ "}
          {file.filePath}
        </span>

        <span className="text-[10px] text-[var(--wood-muted)]">
          {FILE_STATUS_LABELS[file.status] || file.status}
        </span>

      </div>

      {
        file.status === "generate_failed" && file.generateError && (
          <div className="text-xs text-red-400">{file.generateError}</div>
        )
      }

      {
        file.status === "write_failed" && file.writeError && (
          <div className="text-xs text-red-400">{file.writeError}</div>
        )
      }

      {
        file.status === "conflict" && (
          <div className="text-xs text-amber-400">
            Tiedosto on muuttunut suunnitelman luonnin jälkeen.
          </div>
        )
      }

      <DiffView diff={file.diff} />

      {
        testDisplay && (
          <div className={`text-xs ${testDisplay.className}`}>
            {testDisplay.icon} {testDisplay.label}
            {
              file.testStatus === "skipped" && file.testSkippedReason && (
                <span className="text-[var(--wood-muted)]"> — {file.testSkippedReason}</span>
              )
            }
          </div>
        )
      }

    </div>

  )

}

function SetBubble({ set, onApprovePlan, onApprove, onReject, onWrite, busy }) {

  const status = set.status

  const visibleFiles = set.files.filter(file => !file.blocked)

  const blockedFiles = set.files.filter(file => file.blocked)

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

        <div className="font-medium">Suunnitelma</div>

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
          {SET_STATUS_LABELS[status] || status}
        </span>

      </div>

      {
        set.planExplanation && (
          <div className="text-sm leading-relaxed">{set.planExplanation}</div>
        )
      }

      {
        set.writeError && (
          <div className="text-xs text-amber-400">{set.writeError}</div>
        )
      }

      {
        status === "plan_ready" ? (

          <div className="space-y-2">

            {set.files.map(file => <PlanFileRow key={file.id} file={file} />)}

            <div className="flex gap-2 pt-1">

              <button
                disabled={busy || visibleFiles.length === 0}
                onClick={onApprovePlan}
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
                Hyväksy suunnitelma
              </button>

              <button
                disabled={busy}
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

            {
              visibleFiles.length === 0 && (
                <div className="text-xs text-red-400">
                  Kaikki suunnitellut tiedostot estettiin - pyyntöä ei voi toteuttaa turvallisesti.
                </div>
              )
            }

          </div>

        ) : (

          <div className="space-y-3">

            {
              blockedFiles.length > 0 && (
                <div className="space-y-2">
                  {blockedFiles.map(file => <PlanFileRow key={file.id} file={file} />)}
                </div>
              )
            }

            {visibleFiles.map(file => <FileReviewCard key={file.id} file={file} />)}

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
                Hyväksy kaikki
              </button>

              <button
                disabled={
                  (status !== "approved" && status !== "partial_write_failed") || busy
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
                Kirjoita kaikki
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

    </div>

  )

}

function MultiFileChatPanel() {

  const [prompt, setPrompt] = useState("")

  const [isThinking, setIsThinking] = useState(false)

  const [busySetId, setBusySetId] = useState(null)

  const [errorMessage, setErrorMessage] = useState("")

  const [turns, setTurns] = useState([

    {
      role: "assistant",
      kind: "text",
      content:
        "Terve. Kuvaile muutos joka saattaa tarvita useamman " +
        "tiedoston (esim. \"lisää uusi sivu\") - ehdotan ensin " +
        "suunnitelman tarvittavista tiedostoista, ja vasta " +
        "hyväksynnän jälkeen kirjoitan mitään.",
    },

  ])

  function updateSetInPlace(set) {

    setTurns(
      previous =>
        previous.map(
          turn =>
            turn.kind === "set" && turn.set.id === set.id
              ? { ...turn, set }
              : turn,
        ),
    )

  }

  async function sendMessage() {

    if (!prompt.trim()) {

      return

    }

    const userPrompt = prompt

    setTurns(previous => [
      ...previous,
      { role: "user", kind: "text", content: userPrompt },
    ])

    setPrompt("")

    setIsThinking(true)

    setErrorMessage("")

    try {

      const set = await apiPost("/dev-draft-sets", { prompt: userPrompt })

      setTurns(previous => [
        ...previous,
        { role: "assistant", kind: "set", set },
      ])

    } catch (error) {

      setTurns(previous => [
        ...previous,
        {
          role: "assistant",
          kind: "text",
          content: `Suunnitelman luonti epäonnistui: ${error.message}`,
        },
      ])

    } finally {

      setIsThinking(false)

    }

  }

  async function approvePlan(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/approve-plan`)

      updateSetInPlace(set)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  async function approveSet(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/approve`)

      updateSetInPlace(set)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  async function rejectSet(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/reject`)

      updateSetInPlace(set)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  async function writeSet(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/write`)

      updateSetInPlace(set)

    } catch (error) {

      try {

        const refreshed = await fetch(
          `http://localhost:3001/api/dev-draft-sets/${setId}`,
        ).then(response => response.json())

        updateSetInPlace(refreshed)

      } catch {

        // ei väliä, alla oleva virheviesti riittää

      }

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  return (

    <div className="relative h-full min-h-0 flex flex-col">

      <div className="wood-scroll flex-1 min-h-0 overflow-y-auto p-5 space-y-4">

        {
          turns.map(
            (turn, index) => (

              <div key={index} className="message-appear flex gap-3 items-start">

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

                    <SetBubble
                      set={turn.set}
                      busy={busySetId === turn.set.id}
                      onApprovePlan={() => approvePlan(turn.set.id)}
                      onApprove={() => approveSet(turn.set.id)}
                      onReject={() => rejectSet(turn.set.id)}
                      onWrite={() => writeSet(turn.set.id)}
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
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--wood-accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--wood-accent)] animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--wood-accent)] animate-bounce" style={{ animationDelay: "240ms" }} />
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

            placeholder="Kuvaile useamman tiedoston muutos, esim. 'lisää uusi sivu'"

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

            disabled={isThinking || !prompt.trim()}

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

            Ehdota suunnitelma ➤

          </button>

        </div>

      </div>

    </div>

  )

}

export default MultiFileChatPanel
