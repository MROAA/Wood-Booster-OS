import { useEffect, useState } from "react"

import { apiGet, apiPost, apiPut } from "../api/client"

import ChatPanel from "../components/ai/ChatPanel"

import MultiFileChatPanel from "../components/devstudio/MultiFileChatPanel"

import HistoryPanel from "../components/devstudio/HistoryPanel"

import { DRAFT_STATUS_LABELS, TEST_STATUS_DISPLAY, RUN_STATUS_DISPLAY, CHECK_STATUS_LABELS } from "../components/devstudio/statusLabels"

import { parseUnresolvedReferences } from "../components/devstudio/parseUnresolvedReferences"

import SavedPromptsRow from "../components/devstudio/SavedPromptsRow"
import PlaybookPicker from "../components/devstudio/PlaybookPicker"
import FilePicker from "../components/devstudio/FilePicker"
import ModelBadge from "../components/devstudio/ModelBadge"
import ModelPicker from "../components/devstudio/ModelPicker"

import DiffView from "../components/devstudio/DiffView"

import { useElapsedSeconds } from "../components/devstudio/useElapsedSeconds"


function DevStudio() {
  const [activeTab, setActiveTab] = useState("chat")

  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [prompt, setPrompt] = useState("")
  const [filePath, setFilePath] = useState("")
  const [generateModel, setGenerateModel] = useState(undefined)
  const [compareGenerate, setCompareGenerate] = useState(false)
  const [compareGenerateModel, setCompareGenerateModel] = useState(undefined)
  const [generating, setGenerating] = useState(false)

  const generatingElapsedSeconds = useElapsedSeconds(generating)

  const [busyDraftId, setBusyDraftId] = useState(null)

  const [explainFilePath, setExplainFilePath] = useState("")
  const [explaining, setExplaining] = useState(false)
  const [explainResult, setExplainResult] = useState(null)
  const [explainError, setExplainError] = useState("")

  const [reviewFilePath, setReviewFilePath] = useState("")
  const [reviewing, setReviewing] = useState(false)
  const [reviewResult, setReviewResult] = useState(null)
  const [reviewError, setReviewError] = useState("")

  const [refactorFilePath, setRefactorFilePath] = useState("")
  const [refactorModel, setRefactorModel] = useState(undefined)
  const [compareRefactor, setCompareRefactor] = useState(false)
  const [compareRefactorModel, setCompareRefactorModel] = useState(undefined)
  const [refactoring, setRefactoring] = useState(false)
  const [refactorExplanation, setRefactorExplanation] = useState("")
  const [refactorError, setRefactorError] = useState("")

  const [debugFilePath, setDebugFilePath] = useState("")
  const [debugErrorMessage, setDebugErrorMessage] = useState("")
  const [debugModel, setDebugModel] = useState(undefined)
  const [compareDebug, setCompareDebug] = useState(false)
  const [compareDebugModel, setCompareDebugModel] = useState(undefined)
  const [debugging, setDebugging] = useState(false)
  const [debugDiagnosis, setDebugDiagnosis] = useState("")
  const [debugError, setDebugError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setErrorMessage("")

        const draftsData = await apiGet("/python-drafts")

        if (cancelled) {
          return
        }

        setDrafts(Array.isArray(draftsData) ? draftsData : [])
      } catch (loadError) {
        if (!cancelled) {
          setErrorMessage(loadError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  async function generateDraft() {
    if (!prompt.trim() || !filePath.trim()) {
      setErrorMessage("Kerro mitä skripti tekee ja anna sille tiedostonimi.")
      return
    }

    setGenerating(true)
    setErrorMessage("")

    // Peräkkäin, ei rinnakkain - ks. perustelu MultiFileChatPanel.jsx:n
    // sendMessage()-funktiosta (paikallinen Ollama jonottaisi
    // samanaikaiset generoinnit joka tapauksessa).
    const modelsToRun = compareGenerate ? [generateModel, compareGenerateModel] : [generateModel]
    const compareGroupId = compareGenerate ? Date.now() : null
    let anySucceeded = false

    for (const modelToUse of modelsToRun) {
      try {
        const draft = await apiPost("/python-drafts", {
          useAI: true,
          prompt,
          filePath,
          model: modelToUse,
        })

        setDrafts(current => [{ ...draft, compareGroupId }, ...current])
        anySucceeded = true
      } catch (generateError) {
        setErrorMessage(generateError.message)
      }
    }

    if (anySucceeded) {
      setPrompt("")
      setFilePath("")
    }

    setGenerating(false)
  }

  async function explainCode() {
    if (!explainFilePath.trim()) {
      setExplainError("Anna projektin sisäisen .py-tiedoston polku.")
      return
    }

    setExplaining(true)
    setExplainError("")
    setExplainResult(null)

    try {
      const result = await apiPost("/python-explain", {
        filePath: explainFilePath,
      })

      setExplainResult(result)
    } catch (explainErr) {
      setExplainError(explainErr.message)
    } finally {
      setExplaining(false)
    }
  }

  async function reviewCode() {
    if (!reviewFilePath.trim()) {
      setReviewError("Anna projektin sisäisen .py-tiedoston polku.")
      return
    }

    setReviewing(true)
    setReviewError("")
    setReviewResult(null)

    try {
      const result = await apiPost("/python-review", {
        filePath: reviewFilePath,
      })

      setReviewResult(result)
    } catch (reviewErr) {
      setReviewError(reviewErr.message)
    } finally {
      setReviewing(false)
    }
  }

  async function refactorCode() {
    if (!refactorFilePath.trim()) {
      setRefactorError("Anna projektin sisäisen .py-tiedoston polku.")
      return
    }

    setRefactoring(true)
    setRefactorError("")
    setRefactorExplanation("")

    const modelsToRun = compareRefactor ? [refactorModel, compareRefactorModel] : [refactorModel]
    const compareGroupId = compareRefactor ? Date.now() : null

    for (const modelToUse of modelsToRun) {
      try {
        const draft = await apiPost("/python-drafts/refactor", {
          filePath: refactorFilePath,
          model: modelToUse,
        })

        setDrafts(current => [{ ...draft, compareGroupId }, ...current])
        setRefactorExplanation(
          draft.explanation ||
            "Uusi luonnos lisätty alle - ei muutosselitystä.",
        )
      } catch (refactorErr) {
        setRefactorError(refactorErr.message)
      }
    }

    setRefactoring(false)
  }

  async function debugCode() {
    if (!debugFilePath.trim()) {
      setDebugError("Anna projektin sisäisen .py-tiedoston polku.")
      return
    }

    setDebugging(true)
    setDebugError("")
    setDebugDiagnosis("")

    const modelsToRun = compareDebug ? [debugModel, compareDebugModel] : [debugModel]
    const compareGroupId = compareDebug ? Date.now() : null

    for (const modelToUse of modelsToRun) {
      try {
        const draft = await apiPost("/python-drafts/debug", {
          filePath: debugFilePath,
          errorMessage: debugErrorMessage,
          model: modelToUse,
        })

        setDrafts(current => [{ ...draft, compareGroupId }, ...current])
        setDebugDiagnosis(
          draft.diagnosis ||
            "Uusi luonnos lisätty alle - ei diagnoosia.",
        )
      } catch (debugErr) {
        setDebugError(debugErr.message)
      }
    }

    setDebugging(false)
  }

  function updateDraftInList(updated) {
    setDrafts(current =>
      current.map(draft => (draft.id === updated.id ? updated : draft)),
    )
  }

  async function updateCode(draft, code) {
    updateDraftInList({ ...draft, code })
  }

  async function saveDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}`, {
        code: draft.code,
        filePath: draft.filePath,
      })

      updateDraftInList(updated)
    } catch (saveError) {
      setErrorMessage(saveError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function approveDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/approve`, {})

      updateDraftInList(updated)
    } catch (approveError) {
      setErrorMessage(approveError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function reviseDraft(draft, feedback) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/revise`, { feedback })

      updateDraftInList(updated)
    } catch (reviseError) {
      setErrorMessage(reviseError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function rejectDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/reject`, {})

      updateDraftInList(updated)
    } catch (rejectError) {
      setErrorMessage(rejectError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function archiveDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/archive`, {})

      updateDraftInList(updated)
    } catch (archiveError) {
      setErrorMessage(archiveError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function unarchiveDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/unarchive`, {})

      updateDraftInList(updated)
    } catch (unarchiveError) {
      setErrorMessage(unarchiveError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function writeDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/write`, {})

      updateDraftInList(updated)
    } catch (writeError) {
      setErrorMessage(writeError.message)

      try {
        const refreshed = await apiGet("/python-drafts")

        setDrafts(Array.isArray(refreshed) ? refreshed : [])
      } catch {
        // ignore refresh failure, error message already shown
      }
    } finally {
      setBusyDraftId(null)
    }
  }

  async function runDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/run`, {})

      updateDraftInList(updated)
    } catch (runError) {
      setErrorMessage(runError.message)

      try {
        const refreshed = await apiGet("/python-drafts")

        setDrafts(Array.isArray(refreshed) ? refreshed : [])
      } catch {
        // ignore refresh failure, error message already shown
      }
    } finally {
      setBusyDraftId(null)
    }
  }

  async function checkPrStatus(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/check-pr-status`, {})

      updateDraftInList(updated)
    } catch (checkError) {
      setErrorMessage(checkError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function revertPr(draft) {
    if (!window.confirm("Peruuta tämä yhdistetty Pull Request avaamalla uusi, peruuttava PR?")) {
      return
    }

    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/revert-pr`, {})

      updateDraftInList(updated)
    } catch (revertError) {
      setErrorMessage(revertError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function checkRevertPrStatus(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/check-revert-pr-status`, {})

      updateDraftInList(updated)
    } catch (checkError) {
      setErrorMessage(checkError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  /*
   * Kokeilee samaa luonnosta toisella mallilla jälkikäteen. Kolme eri
   * reittiä loivat alunperin PythonCodeDraftin (generoi/refaktoroi/
   * debuggaa), eikä lähdetoiminto ole oma kenttänsä - päätellään se
   * luonnoksen omasta prompt-etuliitteestä, täsmälleen samalla tavalla
   * kuin nuo kolme reittiä sen itse rakentavat (ks. devStudio.js).
   *
   * "compareGroupId" on olemassa oleva, vain selaimen puolella elävä
   * (ei tallenneta kantaan) merkintä viime kierroksen "vertaile kahta
   * mallia" -toiminnosta - tässä sitä käytetään uudelleen, mutta koska
   * lähdeluonnos on jo jossain kohtaa listaa (ei aina listan alussa),
   * uusi luonnos pitää pujottaa sen VIEREEN, ei listan kärkeen, jotta
   * "🔀 Vertailu"-otsikko (joka näyttää vain kunkin ryhmän ensimmäisen
   * listajärjestyksen mukaisen jäsenen kohdalla) osuu oikeaan pariin.
   */
  async function retryDraftWithModel(sourceDraft, model) {
    setBusyDraftId(sourceDraft.id)
    setErrorMessage("")

    const groupId = sourceDraft.compareGroupId || Date.now()

    try {
      let newDraft

      if (sourceDraft.prompt.startsWith("Refaktoroi: ")) {
        newDraft = await apiPost("/python-drafts/refactor", {
          filePath: sourceDraft.filePath,
          model,
        })
      } else if (sourceDraft.prompt.startsWith("Debug: ")) {
        newDraft = await apiPost("/python-drafts/debug", {
          filePath: sourceDraft.filePath,
          model,
        })
      } else {
        newDraft = await apiPost("/python-drafts", {
          useAI: true,
          prompt: sourceDraft.prompt,
          filePath: sourceDraft.filePath,
          model,
        })
      }

      setDrafts(current => {
        const tagged = current.map(existing =>
          existing.id === sourceDraft.id ? { ...existing, compareGroupId: groupId } : existing,
        )

        const sourceIndex = tagged.findIndex(existing => existing.id === sourceDraft.id)

        const taggedNewDraft = { ...newDraft, compareGroupId: groupId }

        return [...tagged.slice(0, sourceIndex), taggedNewDraft, ...tagged.slice(sourceIndex)]
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function revertDraft(draft) {
    if (!window.confirm("Peruuta tämä muutos ja palauta aiempi tila?")) {
      return
    }

    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/revert`, {})

      updateDraftInList(updated)
    } catch (revertError) {
      setErrorMessage(revertError.message)

      try {
        const refreshed = await apiGet("/python-drafts")

        setDrafts(Array.isArray(refreshed) ? refreshed : [])
      } catch {
        // ignore refresh failure, error message already shown
      }
    } finally {
      setBusyDraftId(null)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="
          text-sm
          font-semibold
          uppercase
          tracking-[0.25em]
          text-[var(--wood-accent)]
        ">
          Boosterverse
        </p>

        <h1 className="
          mt-2
          text-4xl
          font-bold
          text-[var(--wood-text)]
        ">
          🐍 Dev Studio
        </h1>

        <p className="
          mt-3
          max-w-3xl
          text-[var(--wood-muted)]
        ">
          Pyydä muutosta luonnollisella kielellä, tarkista se diffinä,
          hyväksy, ja kirjoita levylle vasta sen jälkeen. Mitään ei
          koskaan kirjoiteta automaattisesti.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`
              rounded-full
              border
              px-4
              py-1.5
              text-sm
              font-medium
              transition-colors
              ${
                activeTab === "chat"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            Chat
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("multifile")}
            className={`
              rounded-full
              border
              px-4
              py-1.5
              text-sm
              font-medium
              transition-colors
              ${
                activeTab === "multifile"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            Useampi tiedosto
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("python")}
            className={`
              rounded-full
              border
              px-4
              py-1.5
              text-sm
              font-medium
              transition-colors
              ${
                activeTab === "python"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            Python-työkalut
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`
              rounded-full
              border
              px-4
              py-1.5
              text-sm
              font-medium
              transition-colors
              ${
                activeTab === "history"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            Historia
          </button>
        </div>
      </header>

      {activeTab === "chat" && (
        <section className="
          h-[600px]
          rounded-2xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-panel)]
          overflow-hidden
        ">
          <ChatPanel />
        </section>
      )}

      {activeTab === "multifile" && (
        <section className="
          h-[600px]
          rounded-2xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-panel)]
          overflow-hidden
        ">
          <MultiFileChatPanel />
        </section>
      )}

      {activeTab === "history" && (
        <section className="
          h-[600px]
          rounded-2xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-panel)]
          overflow-hidden
        ">
          <HistoryPanel />
        </section>
      )}

      {activeTab === "python" && (
      <>

      {errorMessage && (
        <div className="
          rounded-xl
          border
          border-red-900
          bg-red-950/30
          p-4
          text-sm
          text-red-300
        ">
          {errorMessage}
        </div>
      )}

      <section className="
        rounded-2xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        p-5
      ">
        <h2 className="
          text-xl
          font-bold
          text-[var(--wood-text)]
        ">
          Uusi pyyntö
        </h2>

        <div className="mt-4 space-y-3">
          <label className="block text-sm text-[var(--wood-muted)]">
            Mitä skripti tekee?

            <textarea
              className="
                mt-1
                w-full
                rounded-xl
                border
                border-[var(--wood-border)]
                bg-[var(--wood-bg)]
                p-3
                text-[var(--wood-text)]
              "
              rows={3}
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              placeholder="Esim. kirjoita skripti joka muuttaa kansion tiedostonimet pieniksi kirjaimiksi"
            />
          </label>

          <SavedPromptsRow lane="python" currentPrompt={prompt} onUseSaved={setPrompt} />

          <PlaybookPicker lane="python" onUsePlaybook={setPrompt} />

          <label className="block text-sm text-[var(--wood-muted)]">
            Tiedostonimi

            <input
              className="
                mt-1
                w-full
                rounded-xl
                border
                border-[var(--wood-border)]
                bg-[var(--wood-bg)]
                p-3
                text-[var(--wood-text)]
              "
              value={filePath}
              onChange={event => setFilePath(event.target.value)}
              placeholder="esim. rename_lowercase.py"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <ModelPicker value={generateModel} onChange={setGenerateModel} />
            <CompareToggle
              compareEnabled={compareGenerate}
              onToggleCompare={setCompareGenerate}
              compareModel={compareGenerateModel}
              onCompareModelChange={setCompareGenerateModel}
            />
          </div>

          <button
            type="button"
            className="
              rounded-xl
              bg-[var(--wood-accent)]
              px-4
              py-2
              font-semibold
              text-[var(--wood-bg)]
              disabled:opacity-50
            "
            disabled={generating}
            onClick={generateDraft}
          >
            {generating ? `Generoidaan... ${generatingElapsedSeconds}s` : "Luo koodi"}
          </button>
        </div>
      </section>

      <section className="
        rounded-2xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        p-5
      ">
        <h2 className="
          text-xl
          font-bold
          text-[var(--wood-text)]
        ">
          Selitä olemassa oleva koodi
        </h2>

        <p className="mt-1 text-sm text-[var(--wood-muted)]">
          Vain luku - ei muokkaa mitään. Anna projektin sisäisen
          .py-tiedoston polku, esim. src/spacemonkey/spc_facade.py
        </p>

        <div className="mt-4 space-y-3">
          <FilePicker
            value={explainFilePath}
            onChange={event => setExplainFilePath(event.target.value)}
            placeholder="esim. spc.py"
            extensions={[".py"]}
          />

          <button
            type="button"
            className="
              rounded-xl
              bg-[var(--wood-accent)]
              px-4
              py-2
              font-semibold
              text-[var(--wood-bg)]
              disabled:opacity-50
            "
            disabled={explaining}
            onClick={explainCode}
          >
            {explaining ? "Selitetään..." : "Selitä"}
          </button>

          {explainError && (
            <p className="text-sm text-red-300">{explainError}</p>
          )}

          {explainResult && (
            <div className="
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-4
              text-sm
              whitespace-pre-wrap
              text-[var(--wood-text)]
            ">
              {explainResult.explanation}
            </div>
          )}
        </div>
      </section>

      <section className="
        rounded-2xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        p-5
      ">
        <h2 className="
          text-xl
          font-bold
          text-[var(--wood-text)]
        ">
          Katselmoi olemassa oleva koodi
        </h2>

        <p className="mt-1 text-sm text-[var(--wood-muted)]">
          Vain luku - ei muokkaa mitään. AI antaa rakentavan
          arvion koodista, esim. src/spacemonkey/security_guard.py
        </p>

        <div className="mt-4 space-y-3">
          <FilePicker
            value={reviewFilePath}
            onChange={event => setReviewFilePath(event.target.value)}
            placeholder="esim. spc.py"
            extensions={[".py"]}
          />

          <button
            type="button"
            className="
              rounded-xl
              bg-[var(--wood-accent)]
              px-4
              py-2
              font-semibold
              text-[var(--wood-bg)]
              disabled:opacity-50
            "
            disabled={reviewing}
            onClick={reviewCode}
          >
            {reviewing ? "Katselmoidaan..." : "Katselmoi"}
          </button>

          {reviewError && (
            <p className="text-sm text-red-300">{reviewError}</p>
          )}

          {reviewResult && (
            <div className="
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-4
              text-sm
              whitespace-pre-wrap
              text-[var(--wood-text)]
            ">
              {reviewResult.review}
            </div>
          )}
        </div>
      </section>

      <section className="
        rounded-2xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        p-5
      ">
        <h2 className="
          text-xl
          font-bold
          text-[var(--wood-text)]
        ">
          Refaktoroi olemassa oleva koodi
        </h2>

        <p className="mt-1 text-sm text-[var(--wood-muted)]">
          AI kirjoittaa parannellun version tiedostosta uudeksi
          luonnokseksi alle - ei koskaan ylikirjoita alkuperäistä
          tiedostoa suoraan. Tarkista, hyväksy ja kirjoita luonnos
          samalla tavalla kuin muutkin luonnokset.
        </p>

        <div className="mt-4 space-y-3">
          <FilePicker
            value={refactorFilePath}
            onChange={event => setRefactorFilePath(event.target.value)}
            placeholder="esim. spc.py"
            extensions={[".py"]}
          />

          <div className="flex flex-wrap items-center gap-2">
            <ModelPicker value={refactorModel} onChange={setRefactorModel} />
            <CompareToggle
              compareEnabled={compareRefactor}
              onToggleCompare={setCompareRefactor}
              compareModel={compareRefactorModel}
              onCompareModelChange={setCompareRefactorModel}
            />
          </div>

          <button
            type="button"
            className="
              rounded-xl
              bg-[var(--wood-accent)]
              px-4
              py-2
              font-semibold
              text-[var(--wood-bg)]
              disabled:opacity-50
            "
            disabled={refactoring}
            onClick={refactorCode}
          >
            {refactoring ? "Refaktoroidaan..." : "Refaktoroi"}
          </button>

          {refactorError && (
            <p className="text-sm text-red-300">{refactorError}</p>
          )}

          {refactorExplanation && (
            <div className="
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-4
              text-sm
              whitespace-pre-wrap
              text-[var(--wood-text)]
            ">
              {refactorExplanation}
            </div>
          )}
        </div>
      </section>

      <section className="
        rounded-2xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        p-5
      ">
        <h2 className="
          text-xl
          font-bold
          text-[var(--wood-text)]
        ">
          Debugaa olemassa oleva koodi
        </h2>

        <p className="mt-1 text-sm text-[var(--wood-muted)]">
          AI etsii todennäköisen syyn ja kirjoittaa korjatun version
          uudeksi luonnokseksi alle - ei koskaan aja koodia eikä
          ylikirjoita alkuperäistä tiedostoa suoraan. Virheilmoitus
          on valinnainen, mutta auttaa AI:ta huomattavasti.
        </p>

        <div className="mt-4 space-y-3">
          <FilePicker
            value={debugFilePath}
            onChange={event => setDebugFilePath(event.target.value)}
            placeholder="esim. spc.py"
            extensions={[".py"]}
          />

          <textarea
            className="
              w-full
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-3
              text-[var(--wood-text)]
            "
            rows={3}
            value={debugErrorMessage}
            onChange={event => setDebugErrorMessage(event.target.value)}
            placeholder="Liitä virheilmoitus tai kuvaile ongelma (valinnainen)"
          />

          <div className="flex flex-wrap items-center gap-2">
            <ModelPicker value={debugModel} onChange={setDebugModel} />
            <CompareToggle
              compareEnabled={compareDebug}
              onToggleCompare={setCompareDebug}
              compareModel={compareDebugModel}
              onCompareModelChange={setCompareDebugModel}
            />
          </div>

          <button
            type="button"
            className="
              rounded-xl
              bg-[var(--wood-accent)]
              px-4
              py-2
              font-semibold
              text-[var(--wood-bg)]
              disabled:opacity-50
            "
            disabled={debugging}
            onClick={debugCode}
          >
            {debugging ? "Debugataan..." : "Debugaa"}
          </button>

          {debugError && (
            <p className="text-sm text-red-300">{debugError}</p>
          )}

          {debugDiagnosis && (
            <div className="
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-4
              text-sm
              whitespace-pre-wrap
              text-[var(--wood-text)]
            ">
              {debugDiagnosis}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--wood-text)]">
          Luonnokset
        </h2>

        {loading && (
          <p className="text-sm text-[var(--wood-muted)]">Ladataan...</p>
        )}

        {!loading && drafts.filter(draft => !draft.archived).length === 0 && (
          <p className="text-sm text-[var(--wood-muted)]">
            Ei vielä luonnoksia.
          </p>
        )}

        {
          (() => {

            const seenCompareGroups = new Set()

            return drafts.filter(draft => !draft.archived).map(draft => {

              const showCompareLabel =
                draft.compareGroupId && !seenCompareGroups.has(draft.compareGroupId)

              if (draft.compareGroupId) {
                seenCompareGroups.add(draft.compareGroupId)
              }

              return (

                <div key={draft.id}>

                  {
                    showCompareLabel && (
                      <div className="mb-1.5 text-xs text-[var(--wood-muted)]">
                        🔀 Vertailu: {draft.prompt}
                      </div>
                    )
                  }

                  <DraftCard
                    draft={draft}
                    busy={busyDraftId === draft.id}
                    onCodeChange={code => updateCode(draft, code)}
                    onSave={() => saveDraft(draft)}
                    onApprove={() => approveDraft(draft)}
                    onWrite={() => writeDraft(draft)}
                    onRevert={() => revertDraft(draft)}
                    onRevise={feedback => reviseDraft(draft, feedback)}
                    onReject={() => rejectDraft(draft)}
                    onCheckPrStatus={() => checkPrStatus(draft)}
                    onRevertPr={() => revertPr(draft)}
                    onCheckRevertPrStatus={() => checkRevertPrStatus(draft)}
                    onRetryWithModel={model => retryDraftWithModel(draft, model)}
                    onArchive={() => archiveDraft(draft)}
                    onUnarchive={() => unarchiveDraft(draft)}
                    onRun={() => runDraft(draft)}
                  />

                </div>

              )

            })

          })()
        }
      </section>

      </>
      )}
    </div>
  )
}


function CompareToggle({ compareEnabled, onToggleCompare, compareModel, onCompareModelChange }) {

  return (
    <>
      <button
        type="button"
        onClick={() => onToggleCompare(enabled => !enabled)}
        className={`
          rounded-full
          border
          px-2.5
          py-1
          text-xs
          transition-colors
          ${
            compareEnabled
              ? "border-[var(--wood-accent)] text-[var(--wood-text)]"
              : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]"
          }
        `}
      >
        🔀 Vertaile kahta mallia
      </button>

      {
        compareEnabled && (
          <ModelPicker value={compareModel} onChange={onCompareModelChange} />
        )
      }
    </>
  )

}

function RetryWithModelRow({ onRetryWithModel, busy }) {

  const [retryModel, setRetryModel] = useState(undefined)

  const [isOpen, setIsOpen] = useState(false)

  return (

    <div className="mt-3 flex flex-wrap items-center gap-2">

      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className={`
          rounded-full
          border
          px-2.5
          py-1
          text-xs
          transition-colors
          ${
            isOpen
              ? "border-[var(--wood-accent)] text-[var(--wood-text)]"
              : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]"
          }
        `}
      >
        🔁 Kokeile toisella mallilla
      </button>

      {
        isOpen && (

          <>
            <ModelPicker value={retryModel} onChange={setRetryModel} />

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onRetryWithModel(retryModel)
                setIsOpen(false)
                setRetryModel(undefined)
              }}
              className="
                rounded-full
                border
                border-[var(--wood-accent)]
                px-2.5
                py-1
                text-xs
                text-[var(--wood-text)]
                transition-opacity
                disabled:opacity-30
                disabled:cursor-not-allowed
                hover:bg-[var(--wood-accent)]
                hover:text-[var(--wood-bg)]
              "
            >
              Kokeile
            </button>
          </>

        )
      }

    </div>

  )

}

function DraftCard({ draft, busy, onCodeChange, onSave, onApprove, onWrite, onRevert, onRevise, onReject, onCheckPrStatus, onRevertPr, onCheckRevertPrStatus, onRetryWithModel, onArchive, onUnarchive, onRun }) {
  const [reviseFeedback, setReviseFeedback] = useState("")

  const isFinished = [
    "written",
    "rejected",
    "pr_open",
    "pr_merged",
    "pr_closed",
    "pr_revert_open",
    "pr_revert_merged",
    "pr_revert_closed",
  ].includes(draft.status)

  const unresolvedReferences = parseUnresolvedReferences(draft.unresolvedReferences)

  const testDisplay = TEST_STATUS_DISPLAY[draft.testStatus]

  function submitRevise() {
    if (!reviseFeedback.trim()) {
      return
    }

    onRevise(reviseFeedback.trim())
    setReviseFeedback("")
  }

  return (
    <article className="
      rounded-2xl
      border
      border-[var(--wood-border)]
      bg-[var(--wood-panel)]
      p-5
    ">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--wood-text)]">
            {draft.title}
          </h3>

          <p className="mt-1 text-xs text-[var(--wood-muted)]">
            {draft.filePath}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <ModelBadge model={draft.model} />
          <StatusBadge status={draft.status} />
        </div>
      </div>

      {testDisplay && (
        <div className={`mt-2 text-xs ${testDisplay.className}`}>
          {testDisplay.icon} {testDisplay.label}
          {draft.testStatus === "skipped" && draft.testSkippedReason && (
            <span className="text-[var(--wood-muted)]"> — {draft.testSkippedReason}</span>
          )}
        </div>
      )}

      {unresolvedReferences.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-900 bg-amber-950/20 p-2 text-xs text-amber-300">
          ⚠ Koodi viittaa tiedostoon jota ei löydy - tarkista ennen hyväksyntää:
          <ul className="mt-1 list-disc pl-4 font-mono">
            {unresolvedReferences.map((reference, referenceIndex) => (
              <li key={referenceIndex}>{reference}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <DiffView diff={draft.diff} filePath={draft.filePath} />
      </div>

      {draft.status === "draft" && (
        <textarea
          className="
            mt-3
            w-full
            rounded-xl
            border
            border-[var(--wood-border)]
            bg-[var(--wood-bg)]
            p-3
            font-mono
            text-xs
            text-[var(--wood-text)]
          "
          rows={10}
          value={draft.code}
          onChange={event => onCodeChange(event.target.value)}
        />
      )}

      {(draft.status === "write_failed" || draft.status === "pr_failed" || draft.status === "pr_revert_failed") && draft.writeError && (
        <p className="mt-2 text-xs text-red-400">{draft.writeError}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(draft.status === "draft" || draft.status === "approved") && (
          <button
            type="button"
            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              px-3
              py-1.5
              text-sm
              text-[var(--wood-text)]
              disabled:opacity-50
            "
            disabled={busy}
            onClick={onRun}
          >
            ▶ Aja ja näytä tulostus
          </button>
        )}

        {draft.status === "draft" && (
          <button
            type="button"
            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              px-3
              py-1.5
              text-sm
              text-[var(--wood-text)]
              disabled:opacity-50
            "
            disabled={busy}
            onClick={onSave}
          >
            Tallenna muokkaukset
          </button>
        )}

        <button
          type="button"
          className="
            rounded-xl
            border
            border-[var(--wood-border)]
            px-3
            py-1.5
            text-sm
            text-[var(--wood-text)]
            disabled:opacity-50
          "
          disabled={busy || draft.status !== "draft"}
          onClick={onApprove}
        >
          Hyväksy
        </button>

        <button
          type="button"
          className="
            rounded-xl
            bg-[var(--wood-accent)]
            px-3
            py-1.5
            text-sm
            font-semibold
            text-[var(--wood-bg)]
            disabled:opacity-50
          "
          disabled={
            busy ||
            (draft.status !== "approved" &&
              draft.status !== "write_failed" &&
              draft.status !== "pr_failed")
          }
          onClick={onWrite}
        >
          Tee Pull Request
        </button>

        {draft.status === "written" && (
          <button
            type="button"
            className="
              rounded-xl
              border
              border-red-900
              px-3
              py-1.5
              text-sm
              text-red-400
              disabled:opacity-50
            "
            disabled={busy}
            onClick={onRevert}
          >
            Peruuta
          </button>
        )}

        {(draft.status === "pr_merged" || draft.status === "pr_revert_failed") && (
          <button
            type="button"
            className="
              rounded-xl
              border
              border-red-900
              px-3
              py-1.5
              text-sm
              text-red-400
              disabled:opacity-50
            "
            disabled={busy}
            onClick={onRevertPr}
          >
            Peruuta (uusi PR)
          </button>
        )}

        {!isFinished && (
          <button
            type="button"
            className="
              rounded-xl
              border
              border-red-900
              px-3
              py-1.5
              text-sm
              text-red-400
              disabled:opacity-50
            "
            disabled={busy}
            onClick={onReject}
          >
            Hylkää
          </button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={draft.archived ? onUnarchive : onArchive}
          className="
            rounded-full
            border
            border-[var(--wood-border)]
            px-3
            py-1
            text-xs
            text-[var(--wood-muted)]
            transition-opacity
            disabled:opacity-30
            disabled:cursor-not-allowed
            hover:border-[var(--wood-accent)]
            hover:text-[var(--wood-text)]
          "
        >
          {draft.archived ? "Palauta arkistosta" : "Arkistoi"}
        </button>
      </div>

      {draft.runStatus && (
        <div className="mt-3">
          <div className={`text-xs ${RUN_STATUS_DISPLAY[draft.runStatus]?.className || "text-[var(--wood-muted)]"}`}>
            {RUN_STATUS_DISPLAY[draft.runStatus]?.icon || "?"} {RUN_STATUS_DISPLAY[draft.runStatus]?.label || "Ajo epäonnistui"}
          </div>
          {draft.runOutput && (
            <pre className="
              wood-scroll
              mt-1
              max-h-40
              overflow-auto
              rounded-lg
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-2
              text-xs
              text-[var(--wood-text)]
              whitespace-pre-wrap
            ">
              {draft.runOutput}
            </pre>
          )}
        </div>
      )}

      <RetryWithModelRow onRetryWithModel={onRetryWithModel} busy={busy} />

      {draft.status.startsWith("pr_") && !draft.status.startsWith("pr_revert_") && (
        <div className="mt-3 flex items-center gap-2">
          {draft.prUrl && (
            <a
              href={draft.prUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--wood-accent)] underline"
            >
              PR #{draft.prNumber} ↗
            </a>
          )}

          {draft.checkStatus && CHECK_STATUS_LABELS[draft.checkStatus] && (
            <span className={`text-xs ${CHECK_STATUS_LABELS[draft.checkStatus].className}`}>
              {CHECK_STATUS_LABELS[draft.checkStatus].icon} {CHECK_STATUS_LABELS[draft.checkStatus].label}
            </span>
          )}

          {draft.status === "pr_open" && (
            <button
              type="button"
              className="
                rounded-xl
                border
                border-[var(--wood-border)]
                px-3
                py-1
                text-xs
                text-[var(--wood-muted)]
                disabled:opacity-50
              "
              disabled={busy}
              onClick={onCheckPrStatus}
            >
              Tarkista PR:n tila
            </button>
          )}
        </div>
      )}

      {draft.status.startsWith("pr_revert_") && (
        <div className="mt-3 flex items-center gap-2">
          {draft.prUrl && (
            <a
              href={draft.prUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--wood-accent)] underline"
            >
              PR #{draft.prNumber} ↗
            </a>
          )}

          {draft.revertPrUrl && (
            <a
              href={draft.revertPrUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-red-300 underline"
            >
              Peruutus-PR #{draft.revertPrNumber} ↗
            </a>
          )}

          {draft.status === "pr_revert_open" && (
            <button
              type="button"
              className="
                rounded-xl
                border
                border-[var(--wood-border)]
                px-3
                py-1
                text-xs
                text-[var(--wood-muted)]
                disabled:opacity-50
              "
              disabled={busy}
              onClick={onCheckRevertPrStatus}
            >
              Tarkista peruutus-PR:n tila
            </button>
          )}
        </div>
      )}

      {draft.status === "draft" && (
        <div className="mt-4 space-y-2">
          <textarea
            className="
              w-full
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-3
              text-xs
              text-[var(--wood-text)]
              placeholder:text-[var(--wood-muted)]
            "
            rows={2}
            value={reviseFeedback}
            onChange={event => setReviseFeedback(event.target.value)}
            disabled={busy}
            placeholder="Pyydä muutosta tähän luonnokseen, esim. 'lisää docstring'"
          />

          <button
            type="button"
            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              px-3
              py-1.5
              text-sm
              text-[var(--wood-text)]
              disabled:opacity-50
            "
            disabled={busy || !reviseFeedback.trim()}
            onClick={submitRevise}
          >
            Pyydä muutosta
          </button>
        </div>
      )}
    </article>
  )
}


function StatusBadge({ status }) {
  const label = DRAFT_STATUS_LABELS[status] || status

  const toneClass =
    status === "written"
      ? "border-emerald-900 bg-emerald-950/40 text-emerald-400"
      : status === "write_failed"
        ? "border-red-900 bg-red-950/40 text-red-400"
        : status === "approved"
          ? "border-cyan-900 bg-cyan-950/40 text-cyan-400"
          : "border-[var(--wood-border)] bg-[var(--wood-card)] text-[var(--wood-muted)]"

  return (
    <span
      className={`
        w-fit
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-semibold
        ${toneClass}
      `}
    >
      ● {label}
    </span>
  )
}


export default DevStudio
