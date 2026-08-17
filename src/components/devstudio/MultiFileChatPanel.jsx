import { useEffect, useState } from "react"

import SpacemonkeyIcon from "../branding/SpacemonkeyIcon"

import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client"

import SetBubble from "./SetBubble"

import SavedPromptsRow from "./SavedPromptsRow"
import PlaybookPicker from "./PlaybookPicker"
import FileAttachButton from "./FileAttachButton"
import ModelPicker from "./ModelPicker"

import { NON_TERMINAL_SET_STATUSES } from "./statusLabels"

import { useElapsedSeconds } from "./useElapsedSeconds"

import { useApprovePlanProgress } from "./useApprovePlanProgress"

function MultiFileChatPanel() {

  const [prompt, setPrompt] = useState("")

  const [model, setModel] = useState(undefined)

  const [compareMode, setCompareMode] = useState(false)

  const [compareModel, setCompareModel] = useState(undefined)

  const [isThinking, setIsThinking] = useState(false)

  const elapsedSeconds = useElapsedSeconds(isThinking)

  const approvePlanProgress = useApprovePlanProgress()

  const [busySetId, setBusySetId] = useState(null)

  const [previewingSetId, setPreviewingSetId] = useState(null)

  const [previewBusySetId, setPreviewBusySetId] = useState(null)

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

  useEffect(() => {

    async function restorePendingSets() {

      try {

        const sets = await apiGet("/dev-draft-sets")

        const restored = (sets || [])
          .filter(set => NON_TERMINAL_SET_STATUSES.has(set.status))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map(set => ({ role: "assistant", kind: "set", set, restored: true }))

        if (restored.length === 0) {
          return
        }

        setTurns(previous => [
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

    restorePendingSets()

  }, [])

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

    if (compareMode) {

      setTurns(previous => [
        ...previous,
        { role: "assistant", kind: "text", content: `Vertailu: ${userPrompt}` },
      ])

    }

    const modelsToRun = compareMode ? [model, compareModel] : [model]

    // Peräkkäin, ei rinnakkain - paikallinen Ollama-instanssi jonottaa
    // samanaikaiset generoinnit joka tapauksessa, joten rinnakkaisuus
    // ei nopeuttaisi mitään ja vaatisi oman, toisen "ajattelee"-tilan
    // käyttöliittymään ilman hyötyä.
    for (const modelToUse of modelsToRun) {

      try {

        const set = await apiPost("/dev-draft-sets", { prompt: userPrompt, model: modelToUse })

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

      }

    }

    setIsThinking(false)

  }

  /*
   * Kokeilee samaa pyyntöä toisella mallilla jälkikäteen, olemassa
   * olevasta suunnitelmakuplasta - sama "Vertailu"-jako-luonti kuin
   * sendMessage()'n vertailutilassa, mutta vain yksi uusi kutsu
   * kerrallaan koska alkuperäinen pyyntö on jo olemassa eikä sitä
   * tarvitse lähettää uudelleen kahdesti.
   */
  async function retryWithModel(setId, promptText, model) {

    setBusySetId(setId)

    setErrorMessage("")

    setTurns(previous => [
      ...previous,
      { role: "assistant", kind: "text", content: `Vertailu: ${promptText}` },
    ])

    try {

      const set = await apiPost("/dev-draft-sets", { prompt: promptText, model })

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

      setBusySetId(null)

    }

  }

  async function approvePlan(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    approvePlanProgress.start(setId, updateSetInPlace)

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/approve-plan`)

      updateSetInPlace(set)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      approvePlanProgress.stop(setId)

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

  async function reviseFile(setId, fileId, feedback) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/files/${fileId}/revise`, { feedback })

      updateSetInPlace(set)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  async function startPreviewForSet(setId) {

    setPreviewBusySetId(setId)

    setErrorMessage("")

    try {

      const result = await apiPost(`/dev-draft-sets/${setId}/preview`)

      window.open(result.url, "_blank")

      setPreviewingSetId(setId)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setPreviewBusySetId(null)

    }

  }

  async function stopPreviewForSet(setId) {

    setPreviewBusySetId(setId)

    setErrorMessage("")

    try {

      await apiDelete(`/dev-draft-sets/${setId}/preview`)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setPreviewingSetId(null)

      setPreviewBusySetId(null)

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

  async function checkPrStatus(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/check-pr-status`)

      updateSetInPlace(set)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  async function revertSetPr(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/revert-pr`)

      updateSetInPlace(set)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  async function checkRevertSetPrStatus(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/check-revert-pr-status`)

      updateSetInPlace(set)

    } catch (error) {

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

                    <div className="flex flex-col gap-1">

                      {
                        turn.restored && NON_TERMINAL_SET_STATUSES.has(turn.set.status) && (
                          <div className="text-xs italic text-[var(--wood-muted)]">
                            Aiemmin aloitettu, ei vielä valmis.
                          </div>
                        )
                      }

                      <SetBubble
                        set={turn.set}
                        busy={busySetId === turn.set.id}
                        onApprovePlan={() => approvePlan(turn.set.id)}
                        onApprove={() => approveSet(turn.set.id)}
                        onReject={() => rejectSet(turn.set.id)}
                        onWrite={() => writeSet(turn.set.id)}
                        onReviseFile={(fileId, feedback) => reviseFile(turn.set.id, fileId, feedback)}
                        onPreview={() => startPreviewForSet(turn.set.id)}
                        onStopPreview={() => stopPreviewForSet(turn.set.id)}
                        previewing={previewingSetId === turn.set.id}
                        previewBusy={previewBusySetId === turn.set.id}
                        onCheckPrStatus={() => checkPrStatus(turn.set.id)}
                        onRevertPr={() => revertSetPr(turn.set.id)}
                        onCheckRevertPrStatus={() => checkRevertSetPrStatus(turn.set.id)}
                        onRetryWithModel={model => retryWithModel(turn.set.id, turn.set.prompt, model)}
                      />

                    </div>

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
                <span className="text-[10px] text-[var(--wood-muted)] ml-1">{elapsedSeconds}s</span>
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

        <SavedPromptsRow lane="koodi" currentPrompt={prompt} onUseSaved={setPrompt} />

        <PlaybookPicker lane="koodi" onUsePlaybook={setPrompt} />

        <FileAttachButton prompt={prompt} onAttach={setPrompt} />

        <div className="flex flex-wrap items-center gap-2">

          <ModelPicker value={model} onChange={setModel} />

          <button
            type="button"
            onClick={() => setCompareMode(enabled => !enabled)}
            className={`
              rounded-full
              border
              px-2.5
              py-1
              text-xs
              transition-colors
              ${
                compareMode
                  ? "border-[var(--wood-accent)] text-[var(--wood-text)]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            🔀 Vertaile kahta mallia
          </button>

          {
            compareMode && (
              <ModelPicker value={compareModel} onChange={setCompareModel} />
            )
          }

        </div>

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
